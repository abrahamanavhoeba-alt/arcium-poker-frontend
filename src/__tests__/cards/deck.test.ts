/**
 * Tests for cards/deck.ts
 */

import { describe, it, expect } from '@jest/globals';
import { DeckManager, Suit, Rank } from '../../lib/cards/deck';

describe('DeckManager', () => {
  describe('Deck Creation', () => {
    it('should create a standard 52-card deck', () => {
      const deck = DeckManager.createDeck();
      expect(deck.length).toBe(52);
    });

    it('should have 13 cards of each suit', () => {
      const deck = DeckManager.createDeck();
      const hearts = DeckManager.getCardsBySuit(deck, Suit.Hearts);
      const diamonds = DeckManager.getCardsBySuit(deck, Suit.Diamonds);
      const clubs = DeckManager.getCardsBySuit(deck, Suit.Clubs);
      const spades = DeckManager.getCardsBySuit(deck, Suit.Spades);

      expect(hearts.length).toBe(13);
      expect(diamonds.length).toBe(13);
      expect(clubs.length).toBe(13);
      expect(spades.length).toBe(13);
    });

    it('should have 4 cards of each rank', () => {
      const deck = DeckManager.createDeck();
      const aces = DeckManager.getCardsByRank(deck, Rank.Ace);
      const kings = DeckManager.getCardsByRank(deck, Rank.King);

      expect(aces.length).toBe(4);
      expect(kings.length).toBe(4);
    });
  });

  describe('Card Encoding/Decoding', () => {
    it('should encode and decode cards correctly', () => {
      const deck = DeckManager.createDeck();
      
      for (const card of deck) {
        const encoded = DeckManager.encodeCard(card);
        const decoded = DeckManager.decodeCard(encoded);
        
        expect(decoded).not.toBeNull();
        expect(decoded!.suit).toBe(card.suit);
        expect(decoded!.rank).toBe(card.rank);
      }
    });

    it('should return null for invalid encoded values', () => {
      expect(DeckManager.decodeCard(-1)).toBeNull();
      expect(DeckManager.decodeCard(52)).toBeNull();
      expect(DeckManager.decodeCard(100)).toBeNull();
    });
  });

  describe('Card Display', () => {
    it('should display cards with suit symbols', () => {
      const deck = DeckManager.createDeck();
      const aceOfSpades = deck.find(c => c.rank === Rank.Ace && c.suit === Suit.Spades)!;
      
      const display = DeckManager.getCardDisplay(aceOfSpades);
      expect(display).toContain('A');
      expect(display).toContain('♠');
    });
  });

  describe('Card Comparison', () => {
    it('should compare cards correctly', () => {
      const deck = DeckManager.createDeck();
      const two = deck.find(c => c.rank === Rank.Two)!;
      const ace = deck.find(c => c.rank === Rank.Ace)!;

      expect(DeckManager.compareCards(two, ace)).toBe(-1);
      expect(DeckManager.compareCards(ace, two)).toBe(1);
      expect(DeckManager.compareCards(two, two)).toBe(0);
    });

    it('should sort cards by rank descending', () => {
      const deck = DeckManager.createDeck();
      const sample = [deck[0], deck[13], deck[26], deck[39]];
      const sorted = DeckManager.sortCards(sample);

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].value).toBeGreaterThanOrEqual(sorted[i].value);
      }
    });
  });

  describe('Card Properties', () => {
    it('should identify face cards', () => {
      const deck = DeckManager.createDeck();
      const jack = deck.find(c => c.rank === Rank.Jack)!;
      const queen = deck.find(c => c.rank === Rank.Queen)!;
      const king = deck.find(c => c.rank === Rank.King)!;
      const ace = deck.find(c => c.rank === Rank.Ace)!;

      expect(DeckManager.isFaceCard(jack)).toBe(true);
      expect(DeckManager.isFaceCard(queen)).toBe(true);
      expect(DeckManager.isFaceCard(king)).toBe(true);
      expect(DeckManager.isFaceCard(ace)).toBe(false);
    });

    it('should identify aces', () => {
      const deck = DeckManager.createDeck();
      const ace = deck.find(c => c.rank === Rank.Ace)!;
      const king = deck.find(c => c.rank === Rank.King)!;

      expect(DeckManager.isAce(ace)).toBe(true);
      expect(DeckManager.isAce(king)).toBe(false);
    });
  });

  describe('Dealing', () => {
    it('should deal correct number of cards', () => {
      const deck = DeckManager.createDeck();
      const { dealt, remaining } = DeckManager.dealCards(deck, 5);

      expect(dealt.length).toBe(5);
      expect(remaining.length).toBe(47);
    });

    it('should not modify original deck', () => {
      const deck = DeckManager.createDeck();
      const originalLength = deck.length;
      
      DeckManager.dealCards(deck, 5);
      
      expect(deck.length).toBe(originalLength);
    });
  });

  describe('Shuffling', () => {
    it('should shuffle deck', () => {
      const deck = DeckManager.createDeck();
      const shuffled = DeckManager.shuffleDeck(deck);

      expect(shuffled.length).toBe(52);
      // Extremely unlikely to be in same order
      const sameOrder = shuffled.every((card, i) => 
        card.suit === deck[i].suit && card.rank === deck[i].rank
      );
      expect(sameOrder).toBe(false);
    });

    it('should not modify original deck', () => {
      const deck = DeckManager.createDeck();
      const firstCard = deck[0];
      
      DeckManager.shuffleDeck(deck);
      
      expect(deck[0]).toBe(firstCard);
    });
  });
});
