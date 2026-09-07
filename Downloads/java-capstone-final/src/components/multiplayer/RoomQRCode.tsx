import { QRCodeSVG } from 'qrcode.react';

interface RoomQRCodeProps {
  roomCode: string;
}

export default function RoomQRCode({ roomCode }: RoomQRCodeProps) {
  const joinUrl = `${window.location.origin}/join-room?code=${roomCode}`;

  return (
    <div className="flex flex-col items-center">
      <div className="text-slate-400 mb-2 uppercase tracking-widest text-sm font-semibold">QR Code</div>
      <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 bg-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
        <QRCodeSVG 
          value={joinUrl}
          size={180}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin={false}
        />
      </div>
    </div>
  );
}
