/**
 * Arcium Poker - Player Actions
 * 
 * Handles all player betting actions.
 * Maps to: player_action instruction (IDL lines 376-443)
 */

import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { ProgramClient } from '../connection/program';
import { RPCClient } from '../connection/rpc';
import {
  TxResult,
  ValidationResult,
  Game,
  PlayerState,
  PlayerActionParam,
  PlayerActionType,
  GameStage,
} from '../shared/types';
import { ensureBN } from '../shared/utils';
import { ErrorCode, PokerError } from '../shared/errors';

/**
 * Result of player action
 */
export interface PlayerActionResult extends TxResult {
  game?: Game;
  playerState?: PlayerState;
}

/**
 * Player Actions
 * Handles all player betting actions during gameplay
 */
export class PlayerActions {
  /**
   * Execute a player action
   * 
   * @param gamePDA - Game account public key
   * @param action - Player action parameter
   * @param provider - Anchor provider with wallet
   * @returns Action result with transaction signature
   */
  static async playerAction(
    gamePDA: PublicKey,
    action: PlayerActionParam,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    try {
      // Get program instance
      const program = ProgramClient.getProgram();
      const player = provider.wallet.publicKey;

      // Derive player state PDA
      const [playerStatePDA] = ProgramClient.derivePlayerStatePDA(gamePDA, player);

      // Fetch game and player state to validate
      const [game, playerState] = await Promise.all([
        ProgramClient.fetchGame(gamePDA),
        ProgramClient.fetchPlayerState(playerStatePDA),
      ]);

      if (!game || !playerState) {
        throw new PokerError(ErrorCode.PlayerNotInGame, 'Game or player state not found');
      }

      // Validate action
      const validation = this.validateAction(game, playerState, action);
      if (!validation.valid) {
        throw new PokerError(ErrorCode.InvalidAction, validation.error);
      }

      // Build and send transaction
      const tx = await program.methods
        .playerAction(action)
        .accounts({
          game: gamePDA,
          playerState: playerStatePDA,
          player: player,
        })
        .rpc();

      // Confirm transaction
      await RPCClient.confirmTransaction(tx);

      // Fetch updated state
      const [updatedGame, updatedPlayerState] = await Promise.all([
        ProgramClient.fetchGame(gamePDA),
        ProgramClient.fetchPlayerState(playerStatePDA),
      ]);

      return {
        signature: tx,
        success: true,
        game: updatedGame,
        playerState: updatedPlayerState,
      };
    } catch (error: any) {
      console.error('Error executing player action:', error);
      return {
        signature: '',
        success: false,
        error: error instanceof PokerError ? error : new PokerError(
          ErrorCode.InvalidAction,
          error.message || 'Failed to execute action',
          error
        ),
      };
    }
  }

  /**
   * Fold - Player folds their hand
   */
  static async fold(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    return this.playerAction(gamePDA, { fold: {} }, provider);
  }

  /**
   * Check - Player checks (no bet)
   */
  static async check(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    return this.playerAction(gamePDA, { check: {} }, provider);
  }

  /**
   * Call - Player calls the current bet
   */
  static async call(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    return this.playerAction(gamePDA, { call: {} }, provider);
  }

  /**
   * Bet - Player makes a bet
   */
  static async bet(
    gamePDA: PublicKey,
    amount: number | BN,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    const amountBN = ensureBN(amount);
    return this.playerAction(gamePDA, { bet: { amount: amountBN } }, provider);
  }

  /**
   * Raise - Player raises the current bet
   */
  static async raise(
    gamePDA: PublicKey,
    amount: number | BN,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    const amountBN = ensureBN(amount);
    return this.playerAction(gamePDA, { raise: { amount: amountBN } }, provider);
  }

  /**
   * All-in - Player bets all their chips
   */
  static async allIn(
    gamePDA: PublicKey,
    provider: AnchorProvider
  ): Promise<PlayerActionResult> {
    return this.playerAction(gamePDA, { allIn: {} }, provider);
  }

  /**
   * Validate player action
   */
  static validateAction(
    game: Game,
    playerState: PlayerState,
    action: PlayerActionParam
  ): ValidationResult {
    // Check if game has started
    if (game.stage === GameStage.Waiting || game.stage === GameStage.Finished) {
      return {
        valid: false,
        error: 'Game is not in active play',
      };
    }

    // Check if it's player's turn
    const playerIndex = this.getPlayerIndex(game, playerState.player);
    if (playerIndex !== game.currentPlayerIndex) {
      return {
        valid: false,
        error: "Not player's turn",
      };
    }

    // Check if player has already folded
    if (playerState.hasFolded) {
      return {
        valid: false,
        error: 'Player has already folded',
      };
    }

    // Validate specific action
    if ('fold' in action) {
      return { valid: true }; // Fold is always valid
    }

    if ('check' in action) {
      return this.validateCheck(game, playerState);
    }

    if ('call' in action) {
      return this.validateCall(game, playerState);
    }

    if ('bet' in action) {
      return this.validateBet(game, playerState, action.bet.amount);
    }

    if ('raise' in action) {
      return this.validateRaise(game, playerState, action.raise.amount);
    }

    if ('allIn' in action) {
      return this.validateAllIn(playerState);
    }

    return {
      valid: false,
      error: 'Unknown action type',
    };
  }

  /**
   * Validate check action
   */
  static validateCheck(game: Game, playerState: PlayerState): ValidationResult {
    const callAmount = this.getCallAmount(game, playerState);
    if (callAmount.gt(new BN(0))) {
      return {
        valid: false,
        error: 'Cannot check when there is a bet to call',
      };
    }
    return { valid: true };
  }

  /**
   * Validate call action
   */
  static validateCall(game: Game, playerState: PlayerState): ValidationResult {
    const callAmount = this.getCallAmount(game, playerState);
    if (callAmount.lte(new BN(0))) {
      return {
        valid: false,
        error: 'No bet to call',
      };
    }
    if (callAmount.gt(playerState.chipStack)) {
      return {
        valid: false,
        error: 'Insufficient chips to call (use all-in instead)',
      };
    }
    return { valid: true };
  }

  /**
   * Validate bet action
   */
  static validateBet(
    game: Game,
    playerState: PlayerState,
    amount: BN
  ): ValidationResult {
    if (game.currentBet.gt(new BN(0))) {
      return {
        valid: false,
        error: 'Cannot bet when there is already a bet (use raise instead)',
      };
    }

    if (amount.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Bet amount must be greater than 0',
      };
    }

    if (amount.lt(game.bigBlind)) {
      return {
        valid: false,
        error: `Bet must be at least the big blind (${game.bigBlind.toString()})`,
      };
    }

    if (amount.gt(playerState.chipStack)) {
      return {
        valid: false,
        error: 'Insufficient chips',
      };
    }

    return { valid: true };
  }

  /**
   * Validate raise action
   */
  static validateRaise(
    game: Game,
    playerState: PlayerState,
    amount: BN
  ): ValidationResult {
    if (game.currentBet.lte(new BN(0))) {
      return {
        valid: false,
        error: 'Cannot raise when there is no bet (use bet instead)',
      };
    }

    const minRaise = game.currentBet.mul(new BN(2));
    if (amount.lt(minRaise)) {
      return {
        valid: false,
        error: `Raise must be at least ${minRaise.toString()} (2x current bet)`,
      };
    }

    if (amount.gt(playerState.chipStack)) {
      return {
        valid: false,
        error: 'Insufficient chips',
      };
    }

    return { valid: true };
  }

  /**
   * Validate all-in action
   */
  static validateAllIn(playerState: PlayerState): ValidationResult {
    if (playerState.chipStack.lte(new BN(0))) {
      return {
        valid: false,
        error: 'No chips to go all-in',
      };
    }
    return { valid: true };
  }

  /**
   * Get call amount for player
   */
  static getCallAmount(game: Game, playerState: PlayerState): BN {
    return game.currentBet.sub(playerState.currentBet);
  }

  /**
   * Get player index in game
   */
  static getPlayerIndex(game: Game, player: PublicKey): number {
    for (let i = 0; i < game.playerCount; i++) {
      if (game.players[i].equals(player)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Check if player can check
   */
  static canCheck(game: Game, playerState: PlayerState): boolean {
    return this.validateCheck(game, playerState).valid;
  }

  /**
   * Check if player can call
   */
  static canCall(game: Game, playerState: PlayerState): boolean {
    return this.validateCall(game, playerState).valid;
  }

  /**
   * Check if player can bet
   */
  static canBet(game: Game, playerState: PlayerState): boolean {
    return game.currentBet.lte(new BN(0)) && playerState.chipStack.gt(new BN(0));
  }

  /**
   * Check if player can raise
   */
  static canRaise(game: Game, playerState: PlayerState): boolean {
    return game.currentBet.gt(new BN(0)) && playerState.chipStack.gt(new BN(0));
  }

  /**
   * Get available actions for player
   */
  static getAvailableActions(
    game: Game,
    playerState: PlayerState
  ): PlayerActionType[] {
    const actions: PlayerActionType[] = ['fold']; // Fold is always available

    if (this.canCheck(game, playerState)) {
      actions.push('check');
    }

    if (this.canCall(game, playerState)) {
      actions.push('call');
    }

    if (this.canBet(game, playerState)) {
      actions.push('bet');
    }

    if (this.canRaise(game, playerState)) {
      actions.push('raise');
    }

    if (playerState.chipStack.gt(new BN(0))) {
      actions.push('allIn');
    }

    return actions;
  }
}
