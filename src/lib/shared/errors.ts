/**
 * Arcium Poker - Error Handling
 * 
 * Error codes and handling utilities.
 * All error codes are derived from the smart contract IDL.
 */

/**
 * Error codes from smart contract (IDL lines 953-1068)
 */
export enum ErrorCode {
  GameFull = 6000,
  NotEnoughPlayers = 6001,
  GameAlreadyStarted = 6002,
  InvalidGameStage = 6003,
  PlayerNotInGame = 6004,
  PlayerAlreadyInGame = 6005,
  InsufficientBalance = 6006,
  BuyInTooLow = 6007,
  BuyInTooHigh = 6008,
  InvalidBetAmount = 6009,
  NotPlayerTurn = 6010,
  InvalidAction = 6011,
  InsufficientChips = 6012,
  InvalidSeatPosition = 6013,
  SeatOccupied = 6014,
  CannotLeaveDuringHand = 6015,
  DeckNotInitialized = 6016,
  CardsNotDealt = 6017,
  InvalidCardIndex = 6018,
  ArciumMpcFailed = 6019,
  EncryptionFailed = 6020,
  InvalidGameConfig = 6021,
  GameNotFinished = 6022,
}

/**
 * Error messages mapping
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.GameFull]: 'Game is full, cannot join',
  [ErrorCode.NotEnoughPlayers]: 'Not enough players to start game',
  [ErrorCode.GameAlreadyStarted]: 'Game has already started',
  [ErrorCode.InvalidGameStage]: 'Game is not in the correct stage for this action',
  [ErrorCode.PlayerNotInGame]: 'Player is not in this game',
  [ErrorCode.PlayerAlreadyInGame]: 'Player already in game',
  [ErrorCode.InsufficientBalance]: 'Insufficient balance for buy-in',
  [ErrorCode.BuyInTooLow]: 'Buy-in amount too low',
  [ErrorCode.BuyInTooHigh]: 'Buy-in amount too high',
  [ErrorCode.InvalidBetAmount]: 'Invalid bet amount',
  [ErrorCode.NotPlayerTurn]: "Not player's turn",
  [ErrorCode.InvalidAction]: 'Invalid action for current game state',
  [ErrorCode.InsufficientChips]: 'Player has insufficient chips',
  [ErrorCode.InvalidSeatPosition]: 'Invalid seat position',
  [ErrorCode.SeatOccupied]: 'Seat is already occupied',
  [ErrorCode.CannotLeaveDuringHand]: 'Cannot leave during active hand',
  [ErrorCode.DeckNotInitialized]: 'Deck not initialized',
  [ErrorCode.CardsNotDealt]: 'Cards not dealt yet',
  [ErrorCode.InvalidCardIndex]: 'Invalid card index',
  [ErrorCode.ArciumMpcFailed]: 'Arcium MPC operation failed',
  [ErrorCode.EncryptionFailed]: 'Encryption/Decryption failed',
  [ErrorCode.InvalidGameConfig]: 'Invalid game configuration',
  [ErrorCode.GameNotFinished]: 'Game has not finished',
};

/**
 * Custom error class for Arcium Poker
 */
export class PokerError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public originalError?: any
  ) {
    super(message || ERROR_MESSAGES[code] || 'Unknown error');
    this.name = 'PokerError';
    Object.setPrototypeOf(this, PokerError.prototype);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return ERROR_MESSAGES[this.code] || this.message;
  }

  /**
   * Check if error is a specific type
   */
  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      originalError: this.originalError,
    };
  }
}

/**
 * Parse Anchor error and convert to PokerError
 */
export function parseAnchorError(error: any): PokerError {
  // Check if it's already a PokerError
  if (error instanceof PokerError) {
    return error;
  }

  // Try to extract error code from Anchor error
  let errorCode: ErrorCode | undefined;
  let errorMessage: string | undefined;

  // Anchor errors typically have this structure
  if (error?.error?.errorCode) {
    const code = error.error.errorCode.code;
    errorCode = Object.values(ErrorCode).includes(code) ? code : undefined;
    errorMessage = error.error.errorCode.message;
  }

  // Check error message for error names
  if (!errorCode && error?.message) {
    const message = error.message.toString();
    for (const [name, code] of Object.entries(ErrorCode)) {
      if (typeof code === 'number' && message.includes(name)) {
        errorCode = code;
        break;
      }
    }
  }

  // Check for custom program error
  if (!errorCode && error?.code) {
    errorCode = error.code;
  }

  // If we found an error code, create PokerError
  if (errorCode !== undefined) {
    return new PokerError(errorCode, errorMessage, error);
  }

  // Generic error - return as unknown error
  return new PokerError(
    ErrorCode.InvalidAction,
    error?.message || 'Unknown error occurred',
    error
  );
}

/**
 * Check if error is a specific poker error
 */
export function isPokerError(error: any, code?: ErrorCode): boolean {
  if (!(error instanceof PokerError)) {
    return false;
  }
  if (code !== undefined) {
    return error.code === code;
  }
  return true;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (error instanceof PokerError) {
    return error.getUserMessage();
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Log error with context
 */
export function logError(error: any, context?: string): void {
  const pokerError = error instanceof PokerError ? error : parseAnchorError(error);
  
  console.error('Poker Error:', {
    context,
    code: pokerError.code,
    message: pokerError.message,
    originalError: pokerError.originalError,
  });
}
