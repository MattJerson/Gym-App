import { Scale } from 'lucide-react';
import { useUnitConversion } from '../../hooks/useUnitConversion';

/**
 * Unit Toggle Component for Admin Dashboard
 * Allows switching between kg/lbs and cm/inches display
 */
export default function UnitToggle() {
  const { useMetric, toggleUnits, weightUnit, heightUnit } = useUnitConversion();

  return (
    <button
      onClick={toggleUnits}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
      title={`Currently displaying: ${useMetric ? 'Metric (kg/cm)' : 'Imperial (lbs/in)'}`}
    >
      <Scale className="h-4 w-4" />
      <span>{weightUnit}/{heightUnit}</span>
    </button>
  );
}
