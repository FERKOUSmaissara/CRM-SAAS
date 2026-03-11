export default function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="table-card">
      {children}
    </div>
  );
}
