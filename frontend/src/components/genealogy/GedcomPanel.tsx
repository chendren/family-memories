import { Download, FileText } from '@phosphor-icons/react';
import { motion } from 'motion/react';

interface Props {
  individualCount: number;
  familyCount: number;
  onExport: () => void;
}

export function GedcomPanel({ individualCount, familyCount, onExport }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-sand-200 p-6 shadow-card"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center flex-shrink-0">
          <FileText size={24} className="text-walnut-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-walnut-800 font-display">
            GEDCOM Export
          </h3>
          <p className="text-sm text-walnut-500 font-body mt-1">
            Download your family tree in standard GEDCOM 5.5.1 format, compatible with
            FamilySearch, Ancestry, MyHeritage, and all major genealogy software.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-walnut-400 font-body">
              {individualCount} individuals
            </span>
            <span className="text-xs text-walnut-300">&middot;</span>
            <span className="text-xs text-walnut-400 font-body">
              {familyCount} families
            </span>
          </div>
          <button
            onClick={onExport}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-terracotta-500 text-white font-semibold rounded-lg text-sm hover:bg-terracotta-600 transition-colors font-body"
          >
            <Download size={16} weight="bold" />
            Download .GED File
          </button>
        </div>
      </div>
    </motion.div>
  );
}
