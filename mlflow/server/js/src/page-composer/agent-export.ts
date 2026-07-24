import type { Config, Data } from '@puckeditor/core';

const DS = '@databricks/design-system';

const TYPE_MAP: Record<
  string,
  { importName: string | null; from: string | null; renderAs?: string; cssHint?: string }
> = {
  DuBoisButton: { importName: 'Button', from: DS },
  DuBoisInput: { importName: 'Input', from: DS },
  DuBoisSimpleSelect: { importName: 'SimpleSelect', from: DS },
  DuBoisSwitch: { importName: 'Switch', from: DS },
  DuBoisCheckbox: { importName: 'Checkbox', from: DS },
  DuBoisRadioGroup: { importName: 'Radio.Group', from: DS },
  DuBoisSegmentedControl: { importName: 'SegmentedControlGroup', from: DS },
  DuBoisSlider: { importName: 'Slider', from: DS },
  DuBoisToggleButton: { importName: 'ToggleButton', from: DS },
  DuBoisDropdownMenu: { importName: 'DropdownMenu', from: DS },
  DuBoisCard: { importName: 'Card', from: DS },
  DuBoisTabs: { importName: 'Tabs', from: DS },
  DuBoisTable: { importName: 'Table', from: DS },
  DuBoisFormField: { importName: 'FormUI', from: DS },
  DuBoisAccordion: { importName: 'Accordion', from: DS },
  DuBoisDrawer: { importName: 'Drawer', from: DS },
  DuBoisPreviewCard: { importName: 'PreviewCard', from: DS },
  DuBoisPopover: { importName: 'Popover', from: DS },
  DuBoisAlert: { importName: 'Alert', from: DS },
  DuBoisBanner: { importName: 'Banner', from: DS },
  DuBoisTooltip: { importName: 'Tooltip', from: DS },
  DuBoisModal: { importName: 'Modal', from: DS },
  DuBoisTypography: { importName: 'Typography', from: DS },
  DuBoisTag: { importName: 'Tag', from: DS },
  DuBoisAvatar: { importName: 'Avatar', from: DS },
  DuBoisEmpty: { importName: 'Empty', from: DS },
  DuBoisSpinner: { importName: 'Spinner', from: DS },
  DuBoisTableSkeleton: { importName: 'TableSkeleton', from: DS },
  DuBoisParagraphSkeleton: { importName: 'ParagraphSkeleton', from: DS },
  DuBoisTitleSkeleton: { importName: 'TitleSkeleton', from: DS },
  DuBoisGenericSkeleton: { importName: 'GenericSkeleton', from: DS },
  DuBoisProgress: { importName: 'Progress', from: DS },
  DuBoisStepper: { importName: 'Stepper', from: DS },
  DuBoisHoverCard: { importName: 'HoverCard', from: DS },
  DuBoisHeader: { importName: 'Header', from: DS },
  DuBoisBreadcrumb: { importName: 'Breadcrumb', from: DS },
  DuBoisPagination: { importName: 'CursorPagination', from: DS },
  DuBoisSpacer: { importName: 'Spacer', from: DS },
  DuBoisTextArea: { importName: 'Input.TextArea', from: DS },
  DuBoisDialogCombobox: { importName: 'DialogCombobox', from: DS },
  DuBoisNotification: { importName: 'Notification', from: DS },
  Columns: {
    importName: null,
    from: null,
    renderAs: 'div',
    cssHint: 'display: grid; gridTemplateColumns: repeat(N, 1fr)',
  },
  Rows: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; flexDirection: column' },
  FlexRow: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; flexDirection: row' },
  FlexColumn: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; flexDirection: column' },
  Section: { importName: null, from: null, renderAs: 'div', cssHint: 'padding container' },
  Divider: { importName: null, from: null, renderAs: 'hr' },
  KeyValueGrid: { importName: null, from: null, renderAs: 'div', cssHint: 'label-value grid' },
  LayoutBox: { importName: null, from: null, renderAs: 'div' },
  ListDetailLayout: { importName: null, from: null, renderAs: 'div', cssHint: 'display: flex; list + detail split' },
  ListItem: { importName: null, from: null, renderAs: 'div', cssHint: 'clickable list row' },
  CodeBlock: { importName: null, from: null, renderAs: 'pre', cssHint: 'syntax-highlighted code block' },
  LinkText: { importName: 'Typography.Link', from: DS },
  IconLabel: { importName: null, from: null, renderAs: 'span', cssHint: 'inline icon + text' },
  OverflowMenu: { importName: 'DropdownMenu', from: DS },
};

const ICON_IMPORT_MAP: Record<string, string> = {
  home: 'HomeIcon',
  beaker: 'BeakerIcon',
  textbox: 'TextBoxIcon',
  cloud: 'CloudModelIcon',
  plus: 'PlusIcon',
  trash: 'TrashIcon',
  pencil: 'PencilIcon',
  search: 'SearchIcon',
  gear: 'GearIcon',
  play: 'PlayIcon',
  lightning: 'LightningIcon',
  copy: 'CopyIcon',
  danger: 'DangerIcon',
  overflow: 'OverflowIcon',
  user: 'UserIcon',
  arrow: 'ArrowRightIcon',
  chevronDown: 'ChevronDownIcon',
  close: 'CloseIcon',
  newWindow: 'NewWindowIcon',
  refresh: 'RefreshIcon',
  download: 'DownloadIcon',
  filter: 'FilterIcon',
  bookmark: 'BookmarkIcon',
  info: 'InfoSmallIcon',
  checkCircle: 'CheckCircleIcon',
  xCircle: 'XCircleIcon',
  check: 'CheckIcon',
  warning: 'WarningIcon',
  sparkle: 'SparkleIcon',
  clock: 'ClockIcon',
  table: 'TableIcon',
  models: 'ModelsIcon',
  dash: 'DashIcon',
  no: 'NoIcon',
  wrench: 'WrenchIcon',
  visible: 'VisibleIcon',
  visibleOff: 'VisibleOffIcon',
  code: 'CodeIcon',
  database: 'DatabaseIcon',
  file: 'FileIcon',
  chartLine: 'ChartLineIcon',
  chain: 'ChainIcon',
  notebook: 'NotebookIcon',
  workflows: 'WorkflowsIcon',
  token: 'TokenIcon',
};

const SPACING_MAP: Record<string, string> = {
  none: '0',
  xs: 'theme.spacing.xs',
  sm: 'theme.spacing.sm',
  md: 'theme.spacing.md',
  lg: 'theme.spacing.lg',
};

const ICON_PROPS = new Set(['icon', 'endIcon', 'image', 'prefix', 'suffix']);
const SPACING_PROPS = new Set(['gap', 'rowGap', 'columnGap', 'size', 'padding', 'contentPadding', 'spacerSize']);

const SLOT_STRATEGY: Record<string, Record<string, string>> = {
  DuBoisCard: { content: 'children' },
  DuBoisModal: { content: 'children' },
  DuBoisDrawer: { content: 'children' },
  DuBoisPreviewCard: { content: 'children' },
  DuBoisFormField: { input: 'children' },
  DuBoisPopover: { content: 'children' },
  DuBoisTooltip: { content: 'children' },
  DuBoisHoverCard: { content: 'children' },
  DuBoisHeader: { breadcrumbs: 'prop', titleAddOns: 'prop', buttons: 'prop' },
  DuBoisTabs: { tab1: 'indexed', tab2: 'indexed', tab3: 'indexed', tab4: 'indexed' },
  DuBoisAccordion: { panel1: 'indexed', panel2: 'indexed', panel3: 'indexed', panel4: 'indexed' },
  FlexRow: { content: 'children' },
  FlexColumn: { content: 'children' },
  Section: { content: 'children' },
  SectionHeader: { action: 'prop' },
  SettingsRow: { trailing: 'prop' },
  ListDetailLayout: { list: 'prop', detail: 'prop' },
  LayoutBox: { content: 'children' },
  Columns: { col1: 'indexed', col2: 'indexed', col3: 'indexed', col4: 'indexed', col5: 'indexed', col6: 'indexed' },
  Rows: { row1: 'indexed', row2: 'indexed', row3: 'indexed', row4: 'indexed', row5: 'indexed', row6: 'indexed' },
};

const DEFAULT_SKIP_VALUES: Set<unknown> = new Set([false, '', 'none', undefined, null, 'middle', 'default']);

function isDefaultValue(key: string, value: unknown, componentType: string): boolean {
  if (
    key === 'label' ||
    key === 'title' ||
    key === 'text' ||
    key === 'message' ||
    key === 'description' ||
    key === 'placeholder' ||
    key === 'value' ||
    key === 'code' ||
    key === 'href' ||
    key === 'name' ||
    key === 'triggerLabel' ||
    key === 'triggerText'
  )
    return false;
  if (key === 'type' && value === 'primary') return false;
  if (key === 'type' && (value === '' || value === undefined)) return true;
  if (key === 'level') return false;
  if (key === 'variant') return false;
  if (
    key === 'count' ||
    key === 'rows' ||
    key === 'columns' ||
    key === 'steps' ||
    key === 'options' ||
    key === 'items' ||
    key === 'tabs' ||
    key === 'panels'
  )
    return false;
  if (key === 'color' && value !== 'default' && value !== '' && value !== undefined) return false;
  if (key === 'defaultValue') return false;
  if (key === 'withoutMargins' && value === true) return false;
  if (key === 'bold' && value === true) return false;
  if (key === 'closable' && value === true) return false;
  if (key === 'danger' && value === true) return false;
  if (key === 'disabled' && value === true) return false;
  if (key === 'loading' && value === true) return false;
  if (key === 'required' && value === true) return false;
  if (key === 'selected' && value === true) return false;
  if (key === 'scrollable' && value === true) return false;
  if (key === 'grid' && value === true) return false;
  return DEFAULT_SKIP_VALUES.has(value);
}

function resolveIcon(value: string): { name: string; from: string } | undefined {
  if (!value || value === 'none') return undefined;
  const name = ICON_IMPORT_MAP[value];
  return name ? { name, from: DS } : undefined;
}

function resolveSpacing(value: string): string | undefined {
  return SPACING_MAP[value] || undefined;
}

function buildLayoutBoxStyle(props: Record<string, any>): Record<string, string> {
  const style: Record<string, string> = {};
  const {
    display, flexDirection, flexWrap, justifyContent, alignItems,
    gridColumns, gridRows, gap, rowGap, columnGap, padding,
    flex, overflow, width, minHeight, maxHeight, height,
    background, border, borderRadius,
  } = props;

  if (display === 'flex') {
    style.display = 'flex';
    if (flexDirection && flexDirection !== 'row') style.flexDirection = flexDirection;
    if (flexWrap === 'wrap') style.flexWrap = 'wrap';
    if (justifyContent && justifyContent !== 'flex-start') style.justifyContent = justifyContent;
    if (alignItems && alignItems !== 'stretch') style.alignItems = alignItems;
  } else if (display === 'grid') {
    style.display = 'grid';
    if (gridColumns) style.gridTemplateColumns = gridColumns;
    if (gridRows && gridRows !== 'auto') style.gridAutoRows = gridRows;
    if (alignItems && alignItems !== 'stretch') style.alignItems = alignItems;
  }

  const gapResolved = resolveSpacing(gap);
  if (gapResolved && gapResolved !== '0') style.gap = gapResolved;

  const rowGapResolved = rowGap ? resolveSpacing(rowGap) : undefined;
  if (rowGapResolved) style.rowGap = rowGapResolved;

  const columnGapResolved = columnGap ? resolveSpacing(columnGap) : undefined;
  if (columnGapResolved) style.columnGap = columnGapResolved;

  const paddingResolved = resolveSpacing(padding);
  if (paddingResolved && paddingResolved !== '0') style.padding = paddingResolved;

  if (flex === 'grow') style.flex = '1';
  else if (flex === 'auto') style.flex = 'auto';

  if (overflow && overflow !== 'visible') style.overflow = overflow;
  if (width && width !== 'auto') style.width = width;
  if (minHeight && minHeight !== 'auto') style.minHeight = minHeight;
  if (maxHeight && maxHeight !== 'none') style.maxHeight = maxHeight;
  if (height && height !== 'auto') style.height = height;

  if (background === 'primary') style.backgroundColor = 'theme.colors.backgroundPrimary';
  else if (background === 'secondary') style.backgroundColor = 'theme.colors.backgroundSecondary';

  if (border === 'all') style.border = '1px solid theme.colors.border';
  else if (border === 'top') style.borderTop = '1px solid theme.colors.border';
  else if (border === 'bottom') style.borderBottom = '1px solid theme.colors.border';
  else if (border === 'decorative') style.border = '1px solid theme.colors.borderDecorative';

  if (borderRadius === 'sm') style.borderRadius = 'theme.borders.borderRadiusSm';
  else if (borderRadius === 'md') style.borderRadius = 'theme.borders.borderRadiusMd';

  return style;
}

function transformItem(item: any, config: Config): any {
  const typeInfo = TYPE_MAP[item.type] || { importName: item.type, from: null };
  const componentConfig = config.components?.[item.type];
  const fields = (componentConfig as any)?.fields || {};
  const slotMap = SLOT_STRATEGY[item.type] || {};

  const cleanProps: Record<string, any> = {};
  let children: any = undefined;

  const isLayoutBox = item.type === 'LayoutBox';

  for (const [key, value] of Object.entries(item.props || {})) {
    if (key === 'id') continue;
    if (key === 'puck') continue;
    if (isLayoutBox && key !== 'content') continue;

    const fieldDef = fields[key] as any;
    if (fieldDef?.type === 'slot' && Array.isArray(value)) {
      const transformedItems = (value as any[]).map((child) => transformItem(child, config));
      if (transformedItems.length === 0) continue;
      const strategy = slotMap[key] || 'children';
      if (strategy === 'children') {
        children = transformedItems;
      } else {
        cleanProps[key] = { _slot: strategy, items: transformedItems };
      }
      continue;
    }

    if (ICON_PROPS.has(key) && typeof value === 'string') {
      const resolved = resolveIcon(value);
      if (resolved) cleanProps[key] = resolved;
      continue;
    }

    if (SPACING_PROPS.has(key) && typeof value === 'string') {
      const resolved = resolveSpacing(value);
      if (resolved) cleanProps[key] = resolved;
      continue;
    }

    if (isDefaultValue(key, value, item.type)) continue;

    cleanProps[key] = value;
  }

  const result: Record<string, any> = {
    type: typeInfo.importName || (typeInfo.renderAs ? `_${typeInfo.renderAs}` : item.type),
  };

  if (typeInfo.from) {
    result._import = typeInfo.from;
  }
  if (isLayoutBox) {
    result.type = '_div';
    result._renderAs = 'div';
    result._style = buildLayoutBoxStyle(item.props || {});
    result._composerType = 'LayoutBox';
  } else if (typeInfo.renderAs) {
    result._renderAs = typeInfo.renderAs;
    if (typeInfo.cssHint) result._cssHint = typeInfo.cssHint;
  }

  if (Object.keys(cleanProps).length > 0) {
    result.props = cleanProps;
  }
  if (children) {
    result.children = children;
  }

  return result;
}

export function transformForAgent(data: Data, config: Config): any {
  return {
    _meta: {
      tool: 'MLflow Page Composer',
      format: 'agent-optimized-v1',
      instructions: [
        'Generate a React TypeScript component from this layout.',
        'Import components from the path in _import (usually @databricks/design-system).',
        'Components with _renderAs are NOT library components — they are plain HTML elements with CSS.',
        'Render them as: <div css={{ ...the_style_object }}>{children}</div>',
        'NEVER try to import LayoutBox, FlexRow, FlexColumn, Section, Columns, or Rows — these are composer-only constructs that map to plain divs with CSS styling.',
        '_style is a ready-to-use camelCase CSS object — spread it into css={{ }} on the _renderAs element.',
        'Spacing values like "theme.spacing.md" reference useDesignSystemTheme() tokens — call const { theme } = useDesignSystemTheme() and use them verbatim.',
        'Icon objects { name, from } should be imported and rendered as JSX: <ChartLineIcon />.',
        '"children" arrays become JSX children of the parent component.',
        'Slots with _slot="prop" become named React props: <Header buttons={<Button />} />.',
        'Slots with _slot="indexed" are numbered panels (tab1, tab2...) — render inside a .map() or sequential blocks.',
      ].join(' '),
    },
    root: data.root?.props || {},
    content: (data.content || []).map((item) => transformItem(item, config)),
  };
}

// ---------------------------------------------------------------------------
// CSS-to-LayoutBox converter — for importing prototypes into the Page Composer.
// Takes a camelCase CSS object (as used in Emotion css={{}} props) and returns
// LayoutBox component props that reproduce the same visual result.
// ---------------------------------------------------------------------------

const REVERSE_SPACING: [number, string][] = [
  [4, 'xs'],
  [8, 'sm'],
  [16, 'md'],
  [24, 'lg'],
];

function pxToSpacingToken(value: unknown): string {
  if (value === undefined || value === null || value === 0) return 'none';
  const num = typeof value === 'string' ? parseInt(value, 10) : (value as number);
  if (isNaN(num)) return 'none';
  for (const [px, token] of REVERSE_SPACING) {
    if (num <= px) return token;
  }
  return 'lg';
}

export function cssToLayoutBoxProps(css: Record<string, any>): Record<string, any> {
  const props: Record<string, any> = {
    display: 'block',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gridColumns: '',
    gridRows: 'auto',
    gap: 'none',
    rowGap: '',
    columnGap: '',
    padding: 'none',
    flex: 'none',
    overflow: 'visible',
    width: 'auto',
    minHeight: 'auto',
    maxHeight: 'none',
    height: 'auto',
    background: 'none',
    border: 'none',
    borderRadius: 'none',
  };

  // Display mode
  if (css.display === 'flex') {
    props.display = 'flex';
    if (css.flexDirection) props.flexDirection = css.flexDirection;
    if (css.flexWrap === 'wrap') props.flexWrap = 'wrap';
  } else if (css.display === 'grid') {
    props.display = 'grid';
    if (css.gridTemplateColumns) props.gridColumns = css.gridTemplateColumns;
    if (css.gridAutoRows) props.gridRows = css.gridAutoRows;
    if (css.gridTemplateRows) props.gridRows = css.gridTemplateRows;
  }

  // Alignment
  if (css.justifyContent) props.justifyContent = css.justifyContent;
  if (css.alignItems) props.alignItems = css.alignItems;

  // Spacing
  if (css.gap !== undefined) props.gap = pxToSpacingToken(css.gap);
  if (css.rowGap !== undefined) props.rowGap = pxToSpacingToken(css.rowGap);
  if (css.columnGap !== undefined) props.columnGap = pxToSpacingToken(css.columnGap);

  // Padding (handle shorthand or single value)
  if (css.padding !== undefined) {
    props.padding = pxToSpacingToken(css.padding);
  } else if (css.paddingTop || css.paddingBottom || css.paddingLeft || css.paddingRight) {
    const avg = Math.max(
      ...[css.paddingTop, css.paddingBottom, css.paddingLeft, css.paddingRight]
        .filter((v) => v !== undefined)
        .map((v) => (typeof v === 'number' ? v : parseInt(v, 10) || 0)),
    );
    props.padding = pxToSpacingToken(avg);
  }

  // Box behavior
  if (css.flex === 1 || css.flex === '1' || css.flex === '1 1 0%') props.flex = 'grow';
  else if (css.flex === 'auto') props.flex = 'auto';

  if (css.overflow && css.overflow !== 'visible') props.overflow = css.overflow;
  if (css.overflowY === 'auto' || css.overflowX === 'auto') props.overflow = 'auto';
  if (css.overflow === 'hidden' || css.overflowY === 'hidden') props.overflow = 'hidden';

  if (css.width && css.width !== 'auto') props.width = String(css.width);
  if (css.minHeight && css.minHeight !== 'auto' && css.minHeight !== 0) props.minHeight = String(css.minHeight);
  if (css.maxHeight && css.maxHeight !== 'none') props.maxHeight = String(css.maxHeight);
  if (css.height && css.height !== 'auto') props.height = String(css.height);

  // Visual styling
  if (css.backgroundColor) {
    if (css.backgroundColor.includes('Secondary') || css.backgroundColor.includes('secondary')) {
      props.background = 'secondary';
    } else if (css.backgroundColor.includes('Primary') || css.backgroundColor.includes('primary')) {
      props.background = 'primary';
    }
  }

  if (css.border) {
    if (css.border.includes('Decorative') || css.border.includes('decorative')) {
      props.border = 'decorative';
    } else {
      props.border = 'all';
    }
  } else if (css.borderTop) {
    props.border = 'top';
  } else if (css.borderBottom) {
    props.border = 'bottom';
  }

  if (css.borderRadius) {
    const r = typeof css.borderRadius === 'number' ? css.borderRadius : parseInt(css.borderRadius, 10);
    if (r > 0 && r <= 4) props.borderRadius = 'sm';
    else if (r > 4) props.borderRadius = 'md';
  }

  return props;
}
