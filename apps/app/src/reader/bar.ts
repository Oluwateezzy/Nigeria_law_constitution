export type ReaderBarAction = {
  id: 'previous' | 'ask' | 'note' | 'next';
  disabled: boolean;
};

export function readerBarActions(position: {
  atStart: boolean;
  atEnd: boolean;
}): ReaderBarAction[] {
  return [
    { id: 'previous', disabled: position.atStart },
    { id: 'ask', disabled: true },
    { id: 'note', disabled: true },
    { id: 'next', disabled: position.atEnd },
  ];
}
