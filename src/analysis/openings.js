import { Chess } from 'chess.js';
import { epd } from './tactics';

// Lichess's public-domain (CC0) opening catalogue, served from jsDelivr.
const OPENING_FILES = ['a', 'b', 'c', 'd', 'e'].map(
  (letter) => `https://cdn.jsdelivr.net/gh/lichess-org/chess-openings@master/${letter}.tsv`,
);

let bookPromise = null;

/**
 * Loads the opening book once: a Map from position (EPD) to opening name. Positions that only
 * occur inside a named line map to null. Resolves to an empty Map if the network is unavailable,
 * in which case no moves are marked as "Book".
 */
export function loadOpeningBook() {
  if (!bookPromise) {
    bookPromise = Promise.all(
      OPENING_FILES.map((url) =>
        fetch(url)
          .then((response) => (response.ok ? response.text() : ''))
          .catch(() => ''),
      ),
    ).then((files) => {
      const book = new Map();
      for (const file of files) {
        for (const row of file.split('\n').slice(1)) {
          const [eco, name, pgn] = row.split('\t');
          if (!pgn) continue;
          const chess = new Chess();
          const sans = pgn.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/);
          try {
            for (const san of sans) {
              chess.move(san);
              const key = epd(chess.fen());
              if (!book.has(key)) book.set(key, null);
            }
          } catch {
            continue;
          }
          book.set(epd(chess.fen()), `${name} (${eco})`);
        }
      }
      return book;
    });
  }
  return bookPromise;
}
