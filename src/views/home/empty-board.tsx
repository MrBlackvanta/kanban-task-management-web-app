export default function EmptyBoard() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 pb-16 text-center md:px-6 md:pb-20 lg:gap-8 lg:pb-24">
      <p className="text-heading-l text-pretty text-muted">
        This board is empty. Create a new column to get started.
      </p>
      <button
        type="button"
        className="h-12 rounded-full bg-purple px-4.5 text-heading-m text-white transition-[background-color] hover:bg-purple-hover"
      >
        <span aria-hidden="true">+ </span>Add New Column
      </button>
    </div>
  );
}
