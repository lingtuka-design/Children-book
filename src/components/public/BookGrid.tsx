import { BookCard, type BookCardData } from "./BookCard";

export function BookGrid({
  books,
  emptyMessage = "No books have been published yet.",
}: {
  books: BookCardData[];
  emptyMessage?: string;
}) {
  if (books.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-paper/60 px-6 py-16 text-center">
        <p className="text-base font-medium text-ink-soft">{emptyMessage}</p>
        <p className="mt-1 text-sm text-ink-faint">
          Check back soon for new stories.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
      {books.map((book, i) => (
        <li key={book.id}>
          <BookCard book={book} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}
