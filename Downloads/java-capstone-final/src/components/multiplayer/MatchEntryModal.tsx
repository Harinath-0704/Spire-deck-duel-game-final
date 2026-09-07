import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MatchEntryModalProps {
  balance: number;
  entryFee: number;
  prizePool: number;
  isPaying: boolean;
  hasPaid: boolean;
  opponentPaid: boolean;
  onPay: () => void;
  onCancel: () => void;
  error: string | null;
}

export default function MatchEntryModal({
  balance,
  entryFee,
  prizePool,
  isPaying,
  hasPaid,
  opponentPaid,
  onPay,
  onCancel,
  error
}: MatchEntryModalProps) {
  const canAfford = balance >= entryFee;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-blue-900/50 bg-slate-900 shadow-2xl"
        >
          <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 p-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                MATCH ENTRY
              </h2>
              <p className="mt-2 text-sm text-blue-200/70">
                Pay the entry fee to battle online
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 border border-blue-900/30">
                <span className="text-sm font-semibold text-slate-300">Entry Fee</span>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <span className="font-mono text-lg font-bold text-yellow-400">{entryFee}</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 border border-blue-900/30 relative overflow-hidden group">
                <div className="absolute inset-0 bg-yellow-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Prize Pool
                </span>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-mono text-xl font-black text-yellow-500">{prizePool}</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 border border-blue-900/30">
                <span className="text-sm font-semibold text-slate-400">Your Balance</span>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-blue-300" />
                  <span className={`font-mono text-md font-bold ${canAfford ? 'text-blue-300' : 'text-red-400'}`}>
                    {balance}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-lg bg-red-900/30 p-3 text-red-400"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <div className="mt-8 space-y-4">
              {!hasPaid ? (
                <>
                  <button
                    onClick={onPay}
                    disabled={!canAfford || isPaying}
                    className={`w-full relative overflow-hidden rounded-xl px-6 py-4 font-black tracking-wider shadow-lg transition-all
                      ${!canAfford 
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 active:scale-[0.98]'
                      }`}
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      {isPaying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          PAY {entryFee} COINS
                        </>
                      )}
                    </div>
                  </button>

                  {!canAfford && (
                    <p className="text-center text-sm text-red-400/80">
                      Not enough coins to enter this match.
                    </p>
                  )}
                  
                  <button
                    onClick={onCancel}
                    disabled={isPaying}
                    className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    CANCEL
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-green-900/30 bg-green-900/10 p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-500/20 p-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="font-bold tracking-wider text-green-400">ENTRY PAID</h3>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-semibold">You:</span>
                      <span className="text-green-400 font-bold flex items-center gap-1">PAID <CheckCircle2 className="h-4 w-4" /></span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-semibold">Opponent:</span>
                      {opponentPaid ? (
                        <span className="text-green-400 font-bold flex items-center gap-1">PAID <CheckCircle2 className="h-4 w-4" /></span>
                      ) : (
                        <span className="text-yellow-400 animate-pulse flex items-center gap-2 font-semibold">
                          <Loader2 className="h-4 w-4 animate-spin" /> Waiting...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
