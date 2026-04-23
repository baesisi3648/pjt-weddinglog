// @TASK P1-S0-T1 - Home placeholder (P1.5에서 핸드오프 JSX로 교체 예정)
import { useCouple } from '../context/CoupleContext';

export default function Home() {
  const { couple, loading } = useCouple();
  return (
    <div className="p-4">
      <h1 className="font-display text-3xl">Home (P4 구현 예정)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <p>Couple: {couple?.groom_name} ♥ {couple?.bride_name}</p>
      )}
    </div>
  );
}
