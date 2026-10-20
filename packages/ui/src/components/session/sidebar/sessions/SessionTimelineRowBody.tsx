import React from 'react';
import { RowMarkTooltip } from './RowMarkTooltip';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';
import { PROJECT_ICON_MAP, resolveProjectColor, ProjectIconImage } from '@/lib/projectMeta';
import { useThemeSystem } from '@/contexts/useThemeSystem';

/**
 * A truncated sidebar title that glides on hover. The marquee travels at a
 * constant pixel speed: the element measures its overflow against the clip
 * box and writes the duration (and the shift distance) as custom properties
 * the keyframes read. A barely-truncated title still gets a short glide
 * instead of a one-frame nudge.
 */
const SidebarTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    const titleRef = React.useRef<HTMLDivElement | null>(null);
    React.useLayoutEffect(() => {
        const el = titleRef.current;
        const clip = el?.parentElement;
        if (!el || !clip) return;
        const overflow = el.scrollWidth - clip.clientWidth;
        const shift = -Math.max(overflow, 1);
        // ~48px/s feels even across short and long titles; 1.25s floor keeps
        // a title that only just ellipsizes visibly moving.
        const durationSec = Math.max(Math.abs(shift) / 48, 1.25);
        el.style.setProperty('--oc-title-shift', `${shift}px`);
        el.style.setProperty('--oc-title-duration', `${durationSec}s`);
    }, [children]);
    return (
        <div dir="auto" ref={titleRef} className={cn('oc-sidebar-title text-[0.9375rem] font-normal', className)}>
            {children}
        </div>
    );
};

type TimelineRowProject = {
  id: string;
  icon?: string | null;
  color?: string | null;
  iconImage?: { mime: string; updatedAt: number; source: 'custom' | 'auto' } | null;
  iconBackground?: string | null;
};

type Props = {
  /** One-line rows (tree rows, Chats, the Tree view's Pinned and In work):
      title and meta on one line, no branch line. */
  compact?: boolean;
  /** Set in Pinned and In work, where projects mix: the second line opens
      with this project's icon. Rows under their project header pass null. */
  project: TimelineRowProject | null;
  /** The project's name, spoken and shown on hover for its icon. */
  projectLabel: string | null;
  /** Three lines (List sorted by time): the project's icon and name get a
      first line of their own, above the title, where the time sits. */
  projectLine?: boolean;
  title: React.ReactNode;
  titleClassName: string;
  branchLabel: string | null;
  /** Set when the branch label is an isolated space's name: the second line
      then carries the space's container mark, with this as its accessible
      name, where a branch shows the branch icon. */
  spaceMark?: string | null;
  /** Replaces the branch on the second line (a run row puts its mark and
      lane count there). */
  metaLineLead?: React.ReactNode;
  statusDot: React.ReactNode;
  /** Pin glyph shown in the meta cluster while the row is pinned. */
  pinnedMarker: React.ReactNode;
  /** Elapsed-turn counter while running/unread, otherwise the compact date. */
  timeSlot: React.ReactNode;
  directoryIndicator: React.ReactNode;
  prBadge: React.ReactNode;
  zombieIndicator: React.ReactNode;
  /** Goal status glyph; opens the second line's state cluster, so it stays
      visible while a turn runs and while the hover actions cover line one. */
  goal?: React.ReactNode;
  badges: React.ReactNode;
  /** Jev's "looks done" check: it sits in the time cluster, where the hover
      Done action appears, left of the status dot so the dot stays by the time. */
  doneHint?: React.ReactNode;
  /** Provider of the session's model; its logo closes the second line. */
  providerId?: string | null;
  /** Reserves room for permanently shown action buttons on the title line. */
  metaPaddingClass?: string;
  hideMetaOnHoverClass: string;
  /** Sets how far hover-revealed actions reach into the title line
      (`--oc-actions-reserve`). */
  actionsReserveClass?: string;
  /** Fades the title's tail away under hover-revealed actions. */
  actionsMaskClass?: string;
};

// Only rows whose project carries a custom image pay for the theme
// subscription the image resolution needs.
const ProjectImageIcon: React.FC<{ project: TimelineRowProject; fallback: React.ReactNode }> = ({ project, fallback }) => {
  const { currentTheme } = useThemeSystem();
  return <ProjectIconImage
    project={{ id: project.id, iconImage: project.iconImage ?? null }}
    options={{ themeVariant: currentTheme.metadata.variant, iconColor: currentTheme.colors.surface.foreground }}
    className="h-full w-full object-contain"
    fallback={fallback}
  />;
};

// `label` makes the icon speak and explain itself on hover, for rows where it
// is the only word for the project; a row that prints the name passes null.
const TimelineProjectIcon: React.FC<{ project: TimelineRowProject; label: string | null }> = ({ project, label }) => {
  const iconName = project.icon ? PROJECT_ICON_MAP[project.icon] : null;
  // Custom colour only when the user set one; otherwise a quiet neutral glyph.
  const iconColor = resolveProjectColor(project.color);
  const glyph = iconName
    ? <Icon name={iconName} className="h-3 w-3" style={iconColor ? { color: iconColor } : undefined} />
    : <Icon name="folder" className="h-3 w-3 text-muted-foreground/75" style={iconColor ? { color: iconColor } : undefined} />;
  // The icon is the row's only word for its project, so it speaks.
  const labelProps = label ? { role: 'img', 'aria-label': label } : {};
  const mark = project.iconImage
    ? <span
      className="inline-flex h-3 w-3 flex-shrink-0 items-center justify-center overflow-hidden rounded-[3px]"
      style={project.iconBackground ? { backgroundColor: project.iconBackground } : undefined}
      {...labelProps}
    >
      <ProjectImageIcon project={project} fallback={glyph} />
    </span>
    : <span className="inline-flex h-3 w-3 flex-shrink-0 items-center justify-center" {...labelProps}>{glyph}</span>;
  return label ? <RowMarkTooltip label={label}>{mark}</RowMarkTooltip> : mark;
};

// Two lines: the title with the session's live state and time, then the
// branch and pull-request state. The project header above names the project;
// in Pinned and In work, where projects mix, its icon opens the second line.
// The List view's list by time has no project headers and room for the name,
// so its rows add a project line above the title.
export const SessionTimelineRowBody: React.FC<Props> = ({
  compact = false,
  project,
  projectLabel,
  projectLine = false,
  title,
  titleClassName,
  branchLabel,
  spaceMark = null,
  metaLineLead = null,
  statusDot,
  pinnedMarker,
  timeSlot,
  directoryIndicator,
  prBadge,
  zombieIndicator,
  goal = null,
  badges,
  doneHint = null,
  providerId,
  metaPaddingClass,
  hideMetaOnHoverClass,
  actionsReserveClass,
  actionsMaskClass,
}) => {
  // Compact rows have no second line, so their badges ride in the meta
  // cluster: the hover actions overlay that cluster, and anything placed
  // after it would sit underneath them.
  const meta = <span className={cn('ms-auto flex flex-shrink-0 items-center gap-1 transition-opacity', metaPaddingClass, hideMetaOnHoverClass)}>
    {compact ? goal : null}
    {compact ? zombieIndicator ?? prBadge : null}
    {compact ? badges : null}
    {directoryIndicator}
    {pinnedMarker}
    {doneHint}
    {statusDot}
    <span className="typography-micro leading-none text-muted-foreground/50 tabular-nums">{timeSlot}</span>
  </span>;
  const titleLine = (
    <div className={cn('@container min-w-0 flex-1 overflow-hidden', actionsMaskClass)}>
      {/* Session titles read one step larger than the project labels above
          them, the way Codex lists chats under a folder. */}
      <SidebarTitle className={titleClassName}>{title}</SidebarTitle>
    </div>
  );
  if (compact) {
    return <div className={cn('@container relative flex w-full min-w-0 items-center gap-1', actionsReserveClass)}>
      {titleLine}
      {meta}
    </div>;
  }
  return <div className="flex w-full min-w-0 flex-col gap-px">
    {/* Fixed 20px first line: the hover actions are positioned against the
        row from outside and rely on this height to sit exactly on it. With
        a project line the actions cover the project's name, never the title. */}
    {projectLine ? <>
      <div className={cn('@container relative flex h-5 w-full min-w-0 items-center gap-1', actionsReserveClass)}>
        {project ? <TimelineProjectIcon project={project} label={null} /> : null}
        {/* Starts past the 12px project icon and the 4px gap. */}
        <span className={cn('min-w-0 flex-1 truncate typography-micro text-muted-foreground/85', project && '[--oc-actions-inset:16px]', actionsMaskClass)}>{projectLabel}</span>
        {meta}
      </div>
      <div className="flex h-5 w-full min-w-0 items-center">
        <div className={cn('@container min-w-0 flex-1 overflow-hidden')}>
          <SidebarTitle className={titleClassName}>{title}</SidebarTitle>
        </div>
      </div>
    </> : (
      <div className={cn('@container relative flex h-5 w-full min-w-0 items-center gap-1', actionsReserveClass)}>
        {titleLine}
        {meta}
      </div>
    )}
    {/* Fixed 16px branch line, always rendered: a row without a branch,
        a model or badges keeps the height of its neighbours, so the list
        does not shift when a branch or a badge arrives and the virtualizer's
        per-kind size estimate stays exact. */}
    <div className="flex h-4 w-full min-w-0 items-center gap-1">
      {project && !projectLine ? <TimelineProjectIcon project={project} label={projectLabel} /> : null}
      {metaLineLead ?? (branchLabel ? (
        <>
          {spaceMark
            // `Icon` hides itself from assistive tech; the space's mark is the row's only word for "space", so it speaks.
            ? <Icon name="box-3" className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" aria-hidden={false} role="img" aria-label={spaceMark} />
            : null}
          {/* No git-branch glyph beside every branch label — text alone is enough. */}
          <span className="min-w-0 truncate typography-micro text-muted-foreground/50">{branchLabel}</span>
        </>
      ) : null)}
      <span className="ms-auto flex flex-shrink-0 items-center gap-1">
        {goal}
        {zombieIndicator ?? prBadge}
        {badges}
        {/* Provider logo removed from rows: it is decoration, not state. */}
      </span>
    </div>
  </div>;
};
