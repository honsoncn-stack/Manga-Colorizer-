export const LAST_READER_BOOK_KEY = "lastReaderBookId";

function toTimestamp(value) {
  if (!value) {
    return Number.NaN;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function sortByNewest(items, field) {
  return [...items].sort((left, right) => {
    const leftTime = toTimestamp(left?.[field]);
    const rightTime = toTimestamp(right?.[field]);
    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }
    if (Number.isNaN(leftTime)) {
      return 1;
    }
    if (Number.isNaN(rightTime)) {
      return -1;
    }
    return rightTime - leftTime;
  });
}

export function pickPreferredReaderBook(books = [], preferredBookId = "") {
  if (!Array.isArray(books) || books.length === 0) {
    return null;
  }

  if (preferredBookId) {
    const matchedBook = books.find((book) => book?.book_id === preferredBookId);
    if (matchedBook) {
      return matchedBook;
    }
  }

  const progressedBooks = books.filter((book) => Number(book?.current_page || 0) > 1);
  const latestProgressed = sortByNewest(progressedBooks, "updated_at")[0];
  if (latestProgressed) {
    return latestProgressed;
  }

  const latestUpdated = sortByNewest(books, "updated_at")[0];
  if (latestUpdated && !Number.isNaN(toTimestamp(latestUpdated?.updated_at))) {
    return latestUpdated;
  }

  const latestCreated = sortByNewest(books, "created_at")[0];
  if (latestCreated && !Number.isNaN(toTimestamp(latestCreated?.created_at))) {
    return latestCreated;
  }

  return books[0];
}
