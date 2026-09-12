import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/account.api";
import { getSocket } from "../lib/socket";

export default function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.list,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = () => qc.invalidateQueries({ queryKey: ["notifications"] });
    socket.on("notification:new", onNew);
    return () => { socket.off("notification:new", onNew); };
  }, [qc]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOneRead = async (id: number) => {
    await notificationApi.markRead(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative shrink-0" aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gold text-ink text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 sm:w-80 max-h-96 overflow-y-auto bg-[rgb(var(--c-bg))] border border-[rgb(var(--c-border)/0.1)] rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--c-border)/0.1)]">
            <p className="text-sm font-medium">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gold hover:underline">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-[rgb(var(--c-text)/0.4)] px-4 py-6 text-center">No notifications yet.</p>
          ) : (
            <ul>
              {notifications.map((n: any) => (
                <li
                  key={n.id}
                  onClick={() => !n.isRead && markOneRead(n.id)}
                  className={`px-4 py-3 text-sm border-b border-[rgb(var(--c-border)/0.05)] last:border-0 cursor-pointer ${n.isRead ? "text-[rgb(var(--c-text)/0.5)]" : "text-[rgb(var(--c-text))]"}`}
                >
                  <p>{n.message}</p>
                  <p className="text-[10px] text-[rgb(var(--c-text)/0.3)] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
