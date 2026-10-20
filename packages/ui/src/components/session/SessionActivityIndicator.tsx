import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';
import { useI18n } from '@/lib/i18n';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSessionDisplayStore } from '@/stores/useSessionDisplayStore';
import { cn } from '@/lib/utils';

/**
 * What a session row or aggregate is showing: its own turn running
 * (busy/retry), a pause kept open by a background subagent or a background
 * command, or a finished turn the user has not seen.
 */
type SessionActivityIndicatorState = 'running' | 'subagent' | 'shell' | 'unread';

const PRESENTATION = {
  running: { icon: 'circle', colorClass: 'text-status-info', labelKey: 'sessions.sidebar.session.status.active' },
  subagent: { icon: 'robot', colorClass: 'text-status-info', labelKey: 'sessions.sidebar.session.status.backgroundSubagent' },
  shell: { icon: 'terminal', colorClass: 'text-status-info', labelKey: 'sessions.sidebar.session.status.backgroundCommand' },
  // Codex-style unread: a small solid blue dot, not a status glyph.
  unread: { icon: 'circle', colorClass: 'bg-primary', labelKey: 'sessions.sidebar.session.status.unread' },
} as const satisfies Record<SessionActivityIndicatorState, { icon: IconName; colorClass: string; labelKey: string }>;

/**
 * Live-activity marker for one session row or aggregate. Running kinds draw
 * the shared `Spinner` when the `animatedActivityIndicators` preference is on
 * (default) and otherwise their own static icon, so a row says why it is busy.
 * Unread is always a small solid blue dot.
 */
export const SessionActivityIndicator: React.FC<{
  state: SessionActivityIndicatorState;
  className?: string;
  /** Extra classes for the running kinds only (e.g. the switcher's pulse). */
  runningClassName?: string;
  /**
   * Name the state in a tooltip above the mark instead of the native title,
   * as the sidebar's row marks do.
   */
  tooltip?: boolean;
}> = ({ state, className, runningClassName, tooltip = false }) => {
  const { t } = useI18n();
  const animated = useSessionDisplayStore((s) => s.animatedActivityIndicators);
  const presentation = PRESENTATION[state];
  const label = t(presentation.labelKey);
  const running = state !== 'unread';

  const mark = (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      aria-label={label}
      title={tooltip ? undefined : label}
      data-session-activity-indicator={state}
    >
      {running ? (
        animated ? (
          <Spinner className={cn('h-3 w-3 text-status-info', runningClassName)} />
        ) : (
          <Icon name={presentation.icon} className={cn('h-3 w-3', presentation.colorClass, runningClassName)} />
        )
      ) : (
        // Small solid blue dot for finished-but-unseen turns.
        <span className={cn('h-1.5 w-1.5 rounded-full', presentation.colorClass)} />
      )}
    </span>
  );
  if (!tooltip) return mark;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{mark}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
};
