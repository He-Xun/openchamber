import React from 'react';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { SessionSidebarActivityKey } from './sessionSidebarRowModel';

const ACTIVITY_TITLE_KEY = {
  pinned: 'sessions.sidebar.activity.pinnedTitle',
  work: 'sessions.sidebar.work.title',
  chats: 'sessions.sidebar.activity.chatsTitle',
  timeline: 'sessions.sidebar.activity.projectsTitle',
  projects: 'sessions.sidebar.activity.projectsTitle',
} as const;

export const SessionSidebarActivityHeader: React.FC<{
  activityKey: SessionSidebarActivityKey;
  collapsed: boolean;
  forceExpanded: boolean;
  alwaysShowActions: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}> = ({ activityKey, collapsed, forceExpanded, alwaysShowActions, onToggle, onNewChat }) => {
  const { t } = useI18n();
  const chats = activityKey === 'chats';
  // One header in both views, so zones line up with the project headers.
  return <div className="relative group/chats -ms-2.5 -me-2">
    <button
      type="button"
      onClick={forceExpanded ? undefined : onToggle}
      disabled={forceExpanded}
      className={cn('group flex w-full items-center gap-1.5 py-1 ps-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50', chats ? 'pe-10' : 'pe-3.5')}
      aria-expanded={!collapsed}
    >
      {/* Chevron only — a zone icon beside project folder icons is noise.
          GPT section headers are plain label + chevron. */}
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
        {!forceExpanded ? (
          <Icon name={collapsed ? 'arrow-right-s' : 'arrow-down-s'} className="h-3.5 w-3.5 text-muted-foreground/70" />
        ) : null}
      </span>
      {/* font-medium (500): Chinese at 600 reads far heavier than Latin. */}
      <span className="typography-ui-header font-medium text-foreground">
        {t(ACTIVITY_TITLE_KEY[activityKey])}
      </span>
    </button>
    {chats ? <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onNewChat(); }}
      className={cn('absolute inset-e-0.5 top-1/2 z-10 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50', alwaysShowActions ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover/chats:opacity-100 group-hover/chats:pointer-events-auto group-has-[:focus-visible]/chats:opacity-100 group-has-[:focus-visible]/chats:pointer-events-auto')}
      aria-label={t('sessions.sidebar.header.actions.newSession')}
    >
      <Icon name="add" className="h-4 w-4" />
    </button> : null}
  </div>;
};
