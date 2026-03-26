import React, { useState } from 'react';
import {
  Menu,
  Search,
  MoreHorizontal,
  FolderClosed,
  Plus,
  Check,
  ArrowDownUp,
  GripVertical,
  PencilLine,
  Trash2,
  X,
  ChevronDown,
  Book,
  CheckSquare,
  Filter,
  ChevronLeft,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface Note {
  id: string;
  title: string;
  notebook: string;
  author: string;
  date: string;
  preview: string;
  content: string;
}

interface Notebook {
  id: string;
  name: string;
  cover: string;
  locked: boolean;
  parentId?: string | null;
}

interface SpaceData {
  id: string;
  name: string;
  notebooks: Notebook[];
  notes: Note[];
}

function getSearchableText(note: Note) {
  return [note.title, note.preview, note.notebook, note.author, note.content.replace(/<[^>]*>/g, ' ')]
    .join(' ')
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return text;
  }

  const matcher = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi');
  return text.split(matcher).map((part, index) =>
    part.toLowerCase() === trimmedQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-yellow-200 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ),
  );
}

function renderCoverPreview(cover: string, alt: string, className: string) {
  if (cover.startsWith('http') || cover.startsWith('data:')) {
    return <img src={cover} alt={alt} className={`${className} object-cover`} />;
  }

  return <div className={className} style={{ background: cover }} aria-label={alt} />;
}

const initialSpaces: SpaceData[] = [
  {
    id: 'general',
    name: 'General',
    notebooks: [
      {
        id: 'nb-ai-trend',
        name: 'AI 트렌드',
        cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&h=120&fit=crop',
        locked: false,
      },
      {
        id: 'nb-ai-platform',
        name: 'AI 플랫폼',
        cover: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
        locked: false,
      },
    ],
    notes: [
      {
        id: '1',
        title: '엔비디아, 30B로 1T 일부 추론 성능 공개',
        notebook: 'AI 트렌드',
        author: '박찬 기자',
        date: 'Mar 25, 10:01 AM',
        preview: '엔비디아가 초대형 모델 추론 비용을 낮추는 전략을 공개했다.',
        content: `
          <h2>엔비디아, 30B로 1T 일부 추론 성능 공개</h2>
          <ul>
            <li>박찬 기자</li>
            <li>업데이트 2026.03.25 10:01</li>
            <li>댓글 0</li>
          </ul>
          <p>엔비디아는 추론 최적화 전략을 통해 일부 워크로드에서 높은 효율을 달성했다고 밝혔다.</p>
          <p>핵심은 모델 병렬화와 캐시 활용, GPU 메모리 운용 방식을 세밀하게 조정하는 데 있다.</p>
        `,
      },
      {
        id: '2',
        title: '메타, 멀티모달 검색에 맞춘 차세대 인덱싱 구조 발표',
        notebook: 'AI 플랫폼',
        author: '이보람 기자',
        date: 'Mar 12, 2:40 PM',
        preview: '검색 정확도와 응답 속도를 동시에 높이기 위한 인덱스 개선안이 공개됐다.',
        content: `
          <h2>메타, 멀티모달 검색에 맞춘 차세대 인덱싱 구조 발표</h2>
          <ul>
            <li>이보람 기자</li>
            <li>업데이트 2026.03.12 14:40</li>
            <li>댓글 2</li>
          </ul>
          <p>메타는 텍스트와 이미지 검색을 동시에 처리하는 멀티모달 검색 엔진 구조를 소개했다.</p>
        `,
      },
    ],
  },
];

const notebookCoverOptions = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop',
  'linear-gradient(135deg, #ef4444, #f59e0b)',
  'linear-gradient(135deg, #facc15, #fde047)',
  'linear-gradient(135deg, #22c55e, #16a34a)',
  'linear-gradient(135deg, #3b82f6, #0f766e)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #fb7185, #f97316)',
];

const emptyNotes: Note[] = [];
const emptyNotebooks: Notebook[] = [];

export default function App() {
  const ALL_NOTES_ID = '__all_notes__';
  const UNCATEGORIZED_ID = '__uncategorized__';
  const [spaces, setSpaces] = useState<SpaceData[]>(initialSpaces);
  const [activeSpaceId, setActiveSpaceId] = useState<string>('general');
  const [activeNoteId, setActiveNoteId] = useState<string>('1');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(ALL_NOTES_ID);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState<boolean>(false);
  const [spaceDialogMode, setSpaceDialogMode] = useState<'create' | 'edit' | null>(null);
  const [spaceNameInput, setSpaceNameInput] = useState<string>('');
  const [notebookDialogMode, setNotebookDialogMode] = useState<'create' | 'edit' | null>(null);
  const [notebookNameInput, setNotebookNameInput] = useState<string>('');
  const [isNotebookLocked, setIsNotebookLocked] = useState<boolean>(false);
  const [selectedNotebookCover, setSelectedNotebookCover] = useState<string>(notebookCoverOptions[0]);
  const [notebookParentId, setNotebookParentId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [isNotebookOptionsOpen, setIsNotebookOptionsOpen] = useState<boolean>(false);
  const [isDeleteNotebookDialogOpen, setIsDeleteNotebookDialogOpen] = useState<boolean>(false);
  const [expandedNotebookIds, setExpandedNotebookIds] = useState<string[]>([]);

  const spaceMenuRef = React.useRef<HTMLDivElement | null>(null);
  const notebookOptionsRef = React.useRef<HTMLDivElement | null>(null);
  const notebookFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? spaces[0];
  const allNotes = activeSpace?.notes ?? emptyNotes;
  const allNotebooks = activeSpace?.notebooks ?? emptyNotebooks;
  const selectedNotebook = allNotebooks.find((notebook) => notebook.id === selectedNotebookId) ?? null;
  const isNotebookDialogOpen = notebookDialogMode !== null;
  const rootNotebooks = allNotebooks.filter((notebook) => !notebook.parentId);
  const childNotebooks = selectedNotebook ? allNotebooks.filter((notebook) => notebook.parentId === selectedNotebook.id) : [];
  const notebookScopedNotes =
    selectedNotebookId === ALL_NOTES_ID
      ? allNotes
      : selectedNotebookId === UNCATEGORIZED_ID
        ? allNotes.filter((note) => note.notebook === 'Uncategorized')
        : selectedNotebook
          ? allNotes.filter((note) => note.notebook === selectedNotebook.name)
          : allNotes;
  const filteredNotes = searchQuery.trim()
    ? notebookScopedNotes.filter((note) => getSearchableText(note).includes(searchQuery.trim().toLowerCase()))
    : notebookScopedNotes;
  const activeNote =
    filteredNotes.find((note) => note.id === activeNoteId) ??
    notebookScopedNotes.find((note) => note.id === activeNoteId) ??
    filteredNotes[0] ??
    notebookScopedNotes[0] ??
    null;
  const notebookCounts = allNotes.reduce<Record<string, number>>((accumulator, note) => {
    accumulator[note.notebook] = (accumulator[note.notebook] ?? 0) + 1;
    return accumulator;
  }, {});
  const canReorderNotes = !searchQuery.trim() && filteredNotes.length > 0;
  const getChildNotebookList = (parentId: string | null) => allNotebooks.filter((notebook) => (notebook.parentId ?? null) === parentId);
  const collectDescendantNotebookIds = (parentId: string): string[] => {
    const directChildren = getChildNotebookList(parentId);
    return directChildren.flatMap((notebook) => [notebook.id, ...collectDescendantNotebookIds(notebook.id)]);
  };
  const toggleNotebookExpanded = (notebookId: string) => {
    setExpandedNotebookIds((current) =>
      current.includes(notebookId) ? current.filter((id) => id !== notebookId) : [...current, notebookId],
    );
  };

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: '내용을 입력하세요...' })],
    content: activeNote?.content ?? '',
    onUpdate: ({ editor }) => {
      if (!activeNote || !activeSpace) {
        return;
      }
      const html = editor.getHTML();
      const text = editor.getText();
      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      setSpaces((current) =>
        current.map((space) =>
          space.id === activeSpace.id
            ? {
                ...space,
                notes: space.notes.map((note) =>
                  note.id === activeNote.id
                    ? {
                        ...note,
                        title: lines[0] || 'New Note',
                        preview: lines.slice(1).join(' ').substring(0, 80),
                        content: html,
                      }
                    : note,
                ),
              }
            : space,
        ),
      );
    },
    editorProps: {
      attributes: {
        class: 'gyver-editor-content prose prose-sm xl:prose-base focus:outline-none max-w-none text-[#202124] leading-snug',
      },
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const nextContent = activeNote?.content ?? '';
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent);
    }
  }, [activeNote, editor]);

  React.useEffect(() => {
    const currentSpace = spaces.find((space) => space.id === activeSpaceId);
    const currentNotebooks = currentSpace?.notebooks ?? [];
    const hasSelectedNotebook =
      selectedNotebookId === ALL_NOTES_ID ||
      selectedNotebookId === UNCATEGORIZED_ID ||
      currentNotebooks.some((notebook) => notebook.id === selectedNotebookId);

    if (!hasSelectedNotebook) {
      setSelectedNotebookId(ALL_NOTES_ID);
    }
  }, [activeSpaceId, selectedNotebookId, spaces]);

  React.useEffect(() => {
    if (!isSpaceMenuOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!spaceMenuRef.current?.contains(event.target as Node)) {
        setIsSpaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isSpaceMenuOpen]);

  React.useEffect(() => {
    if (!isNotebookOptionsOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!notebookOptionsRef.current?.contains(event.target as Node)) {
        setIsNotebookOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isNotebookOptionsOpen]);

  React.useEffect(() => {
    if (!canReorderNotes && isReorderMode) {
      setIsReorderMode(false);
      setDraggedNoteId(null);
    }
  }, [canReorderNotes, isReorderMode]);

  React.useEffect(() => {
    setIsNotebookOptionsOpen(false);
  }, [selectedNotebookId]);

  React.useEffect(() => {
    setExpandedNotebookIds((current) => current.filter((id) => allNotebooks.some((notebook) => notebook.id === id)));
  }, [allNotebooks]);

  React.useEffect(() => {
    if (!selectedNotebook?.parentId) {
      return;
    }
    setExpandedNotebookIds((current) => (current.includes(selectedNotebook.parentId!) ? current : [...current, selectedNotebook.parentId!]));
  }, [selectedNotebook]);

  const switchSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    setActiveNoteId('');
    setSelectedNotebookId(ALL_NOTES_ID);
    setSearchQuery('');
    setIsReorderMode(false);
    setIsSpaceMenuOpen(false);
    setIsNotebookOptionsOpen(false);
  };

  const handleSaveSpace = () => {
    const nextName = spaceNameInput.trim();
    if (!nextName) {
      return;
    }
    if (spaceDialogMode === 'edit' && activeSpace) {
      setSpaces((current) => current.map((space) => (space.id === activeSpace.id ? { ...space, name: nextName } : space)));
    } else {
      const newSpaceId = `space-${Date.now()}`;
      setSpaces((current) => [...current, { id: newSpaceId, name: nextName, notebooks: [], notes: [] }]);
      setActiveSpaceId(newSpaceId);
      setActiveNoteId('');
      setSelectedNotebookId(ALL_NOTES_ID);
      setSearchQuery('');
    }
    setSpaceDialogMode(null);
    setSpaceNameInput('');
  };

  const openNotebookDialog = () => {
    setNotebookNameInput('');
    setIsNotebookLocked(false);
    setSelectedNotebookCover(notebookCoverOptions[0]);
    setNotebookParentId(null);
    setNotebookDialogMode('create');
    setIsNotebookOptionsOpen(false);
  };

  const openSubNotebookDialog = () => {
    if (!selectedNotebook) {
      return;
    }
    setNotebookNameInput('');
    setIsNotebookLocked(false);
    setSelectedNotebookCover(notebookCoverOptions[0]);
    setNotebookParentId(selectedNotebook.id);
    setNotebookDialogMode('create');
    setIsNotebookOptionsOpen(false);
  };

  const openNotebookEditDialog = () => {
    if (!selectedNotebook) {
      return;
    }
    setNotebookNameInput(selectedNotebook.name);
    setIsNotebookLocked(selectedNotebook.locked);
    setSelectedNotebookCover(selectedNotebook.cover);
    setNotebookParentId(selectedNotebook.parentId ?? null);
    setNotebookDialogMode('edit');
    setIsNotebookOptionsOpen(false);
  };

  const openDeleteNotebookDialog = () => {
    if (!selectedNotebook) {
      return;
    }
    setIsDeleteNotebookDialogOpen(true);
    setIsNotebookOptionsOpen(false);
  };

  const closeNotebookDialog = () => {
    setNotebookDialogMode(null);
    setNotebookNameInput('');
    setIsNotebookLocked(false);
    setSelectedNotebookCover(notebookCoverOptions[0]);
    setNotebookParentId(null);
  };

  const handleNotebookCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedNotebookCover(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSaveNotebook = () => {
    const nextName = notebookNameInput.trim();

    if (!activeSpace || !nextName) {
      return;
    }

    if (notebookDialogMode === 'edit' && selectedNotebook) {
      const previousName = selectedNotebook.name;
      setSpaces((current) =>
        current.map((space) =>
          space.id === activeSpace.id
            ? {
                ...space,
                notebooks: space.notebooks.map((notebook) =>
                  notebook.id === selectedNotebook.id
                    ? {
                        ...notebook,
                        name: nextName,
                        cover: selectedNotebookCover,
                        locked: isNotebookLocked,
                      }
                    : notebook,
                ),
                notes: space.notes.map((note) =>
                  note.notebook === previousName
                    ? {
                        ...note,
                        notebook: nextName,
                      }
                    : note,
                ),
              }
            : space,
        ),
      );
      closeNotebookDialog();
      return;
    }

    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name: nextName,
      cover: selectedNotebookCover,
      locked: isNotebookLocked,
      parentId: notebookParentId,
    };
    const starterNote: Note = {
      id: `note-${Date.now()}-starter`,
      title: 'New Note',
      notebook: nextName,
      author: '',
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }),
      preview: '',
      content: '',
    };

    if (notebookParentId) {
      setSpaces((current) =>
        current.map((space) =>
          space.id === activeSpace.id
            ? {
                ...space,
                notebooks: [...space.notebooks, newNotebook],
                notes: [starterNote, ...space.notes],
              }
            : space,
        ),
      );
      setExpandedNotebookIds((current) => (current.includes(notebookParentId) ? current : [...current, notebookParentId]));
      setSelectedNotebookId(newNotebook.id);
      setActiveNoteId(starterNote.id);
      setSearchQuery('');
      setIsReorderMode(false);
      closeNotebookDialog();
      return;
    }

    setSpaces((current) =>
      current.map((space) =>
        space.id === activeSpace.id
          ? {
              ...space,
              notebooks: [...space.notebooks, newNotebook],
              notes: [starterNote, ...space.notes],
            }
          : space,
      ),
    );
    setSelectedNotebookId(newNotebook.id);
    setActiveNoteId(starterNote.id);
    setSearchQuery('');
    setIsReorderMode(false);
    closeNotebookDialog();
  };

  const handleDeleteNotebook = () => {
    if (!activeSpace || !selectedNotebook) {
      return;
    }

    const descendantNotebookIds = collectDescendantNotebookIds(selectedNotebook.id);
    const deletedNotebookIds = new Set([selectedNotebook.id, ...descendantNotebookIds]);
    const deletedNotebookNames = new Set(
      allNotebooks.filter((notebook) => deletedNotebookIds.has(notebook.id)).map((notebook) => notebook.name),
    );
    setSpaces((current) =>
      current.map((space) =>
        space.id === activeSpace.id
          ? {
              ...space,
              notebooks: space.notebooks.filter((notebook) => !deletedNotebookIds.has(notebook.id)),
              notes: space.notes.map((note) =>
                deletedNotebookNames.has(note.notebook)
                  ? {
                      ...note,
                      notebook: 'Uncategorized',
                    }
                  : note,
              ),
            }
          : space,
      ),
    );
    setSelectedNotebookId(UNCATEGORIZED_ID);
    setActiveNoteId('');
    setSearchQuery('');
    setIsReorderMode(false);
    setDraggedNoteId(null);
    setIsDeleteNotebookDialogOpen(false);
  };

  const handleNewNote = () => {
    if (!activeSpace) {
      return;
    }
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      notebook:
        selectedNotebookId === ALL_NOTES_ID || selectedNotebookId === UNCATEGORIZED_ID
          ? 'Uncategorized'
          : selectedNotebook?.name ?? 'Uncategorized',
      author: '',
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
      preview: '',
      content: '',
    };
    setSpaces((current) =>
      current.map((space) => {
        if (space.id !== activeSpace.id) {
          return space;
        }

        const targetNotebookName = newNote.notebook;
        const hasTargetNotebook = space.notebooks.some((notebook) => notebook.name === targetNotebookName);
        const nextNotebooks = hasTargetNotebook
          ? space.notebooks
          : [
              ...space.notebooks,
              {
                id: `notebook-${Date.now()}`,
                name: targetNotebookName,
                cover: 'linear-gradient(135deg, #d4d4d8, #e4e4e7)',
                locked: false,
                parentId: null,
              },
            ];

        return { ...space, notebooks: nextNotebooks, notes: [newNote, ...space.notes] };
      }),
    );
    if (selectedNotebookId === ALL_NOTES_ID) {
      setSelectedNotebookId(UNCATEGORIZED_ID);
    }
    setActiveNoteId(newNote.id);
    setSearchQuery('');
  };

  const moveNote = (sourceId: string, targetId: string) => {
    if (!activeSpace || sourceId === targetId) {
      return;
    }

    const visibleIds = notebookScopedNotes.map((note) => note.id);
    const reorderedVisibleIds = [...visibleIds];
    const sourceIndex = reorderedVisibleIds.indexOf(sourceId);
    const targetIndex = reorderedVisibleIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const [movedId] = reorderedVisibleIds.splice(sourceIndex, 1);
    reorderedVisibleIds.splice(targetIndex, 0, movedId);

    setSpaces((current) =>
      current.map((space) => {
        if (space.id !== activeSpace.id) {
          return space;
        }

        const visibleNotes = reorderedVisibleIds
          .map((id) => space.notes.find((note) => note.id === id))
          .filter((note): note is Note => Boolean(note));
        let visibleCursor = 0;
        const nextNotes = space.notes.map((note) =>
          visibleIds.includes(note.id) ? visibleNotes[visibleCursor++] : note,
        );

        return {
          ...space,
          notes: nextNotes,
        };
      }),
    );
  };

  const renderNotebookTree = (parentId: string | null, depth = 0): React.ReactNode =>
    getChildNotebookList(parentId).map((notebook) => {
      const nestedChildren = getChildNotebookList(notebook.id);
      const isExpanded = expandedNotebookIds.includes(notebook.id);

      return (
        <div key={notebook.id}>
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 16}px` }}>
            {nestedChildren.length > 0 ? (
              <button
                onClick={() => toggleNotebookExpanded(notebook.id)}
                className="rounded-md p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                aria-label={isExpanded ? 'Collapse notebook' : 'Expand notebook'}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
              </button>
            ) : (
              <span className="block h-4 w-4 shrink-0" />
            )}
            <button
              onClick={() => {
                setSelectedNotebookId(notebook.id);
                if (nestedChildren.length > 0 && !isExpanded) {
                  setExpandedNotebookIds((current) => [...current, notebook.id]);
                }
              }}
              className={`flex min-w-0 flex-1 items-center justify-between rounded-md px-3 py-1.5 text-sm ${selectedNotebookId === notebook.id ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {renderCoverPreview(notebook.cover, notebook.name, 'h-5 w-5 rounded-md')}
                <span className="truncate">{notebook.name}</span>
              </div>
              <span className="text-[11px] text-gray-400">{notebookCounts[notebook.name] ?? 0}</span>
            </button>
          </div>
          {nestedChildren.length > 0 && isExpanded && <div className="mt-0.5 space-y-0.5">{renderNotebookTree(notebook.id, depth + 1)}</div>}
        </div>
      );
    });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white text-[#333333]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-3">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen((current) => !current)} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100">
            <Menu size={18} />
          </button>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-gray-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search" className="w-[220px] rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 text-gray-400 hover:text-gray-600">×</button>}
          </div>
        </div>
        <button onClick={handleNewNote} className="rounded-md bg-[#3b82f6] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#2563eb]">
          New Note
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`border-r border-[#e5e7eb] bg-[#f9fafb] transition-all ${isSidebarOpen ? 'w-[230px] opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
          <div className="w-[230px]">
            <div ref={spaceMenuRef} className="relative flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">{activeSpace?.name ?? 'General'}</span>
              <button onClick={() => setIsSpaceMenuOpen((current) => !current)} className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                <MoreHorizontal size={16} />
              </button>
              {isSpaceMenuOpen && (
                <div className="absolute right-3 top-[42px] z-30 w-[220px] rounded-2xl border border-[#242424] bg-[#171717] py-2 text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                  <div className="px-2 pb-2">
                    {spaces.map((space) => (
                      <button key={space.id} onClick={() => switchSpace(space.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10">
                        <span className="w-4">{space.id === activeSpaceId ? <Check size={14} /> : null}</span>
                        <FolderClosed size={14} className="text-white/75" />
                        <span className="truncate">{space.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mx-2 border-t border-white/10 pt-2">
                    <button onClick={() => { setSpaceDialogMode('edit'); setSpaceNameInput(activeSpace?.name ?? ''); setIsSpaceMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10">
                      <PencilLine size={14} className="text-white/80" />
                      <span>Edit</span>
                    </button>
                    <button onClick={() => { setSpaceDialogMode('create'); setSpaceNameInput(''); setIsSpaceMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10">
                      <Plus size={14} className="text-white/80" />
                      <span>New Space</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-0.5 px-2 pb-2">
              <button onClick={() => setSelectedNotebookId(ALL_NOTES_ID)} className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm ${selectedNotebookId === ALL_NOTES_ID ? 'bg-gray-200' : 'hover:bg-gray-200'}`}><div className="flex items-center gap-2.5"><Book size={16} className="text-gray-400" /><span>All Notes</span></div><span className="text-xs text-gray-400">{allNotes.length}</span></button>
              <div className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-gray-200"><div className="flex items-center gap-2.5"><CheckSquare size={16} className="text-pink-400" /><span>Todo</span></div><span className="text-xs text-gray-400">0</span></div>
              <button onClick={() => setSelectedNotebookId(UNCATEGORIZED_ID)} className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm ${selectedNotebookId === UNCATEGORIZED_ID ? 'bg-gray-200' : 'hover:bg-gray-200'}`}><div className="flex items-center gap-2.5"><Filter size={16} className="text-emerald-500" /><span>Uncategorized</span></div><span className="text-xs text-gray-400">{notebookCounts.Uncategorized ?? 0}</span></button>
            </div>

            <div className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider text-gray-500"><ChevronDown size={14} className="text-gray-400" />Quick Access</div>
            <div className="px-2 pb-2">
              {allNotes[0] ? <div className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200">{allNotes[0].title}</div> : <div className="px-3 py-2 text-xs text-gray-400">비어 있는 스페이스입니다.</div>}
            </div>

            <div className="mt-2 flex items-center justify-between px-4 py-2 text-xs font-semibold tracking-wider text-gray-500"><div className="flex items-center gap-2"><ChevronDown size={14} className="text-gray-400" />Notebooks</div><button onClick={openNotebookDialog} className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-blue-500"><Plus size={14} /></button></div>
            <div className="space-y-0.5 px-2 pb-6">
              {rootNotebooks.length > 0 ? renderNotebookTree(null) : <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 px-4 py-4 text-xs text-gray-400">No notebooks yet.</div>}
              {/*
              {false && allNotebooks.length > 0 ? allNotebooks.map((notebook) => (
                <button key={notebook.id} onClick={() => setSelectedNotebookId(notebook.id)} className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm ${selectedNotebookId === notebook.id ? 'bg-gray-200' : 'hover:bg-gray-200'}`}>
                  <div className="flex items-center gap-2.5">
                    {renderCoverPreview(notebook.cover, notebook.name, 'h-5 w-5 rounded-md')}
                    <span>{notebook.name}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{notebookCounts[notebook.name] ?? 0}</span>
                </button>
              )) : <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 px-4 py-4 text-xs text-gray-400">새 스페이스라 노트북이 비어 있습니다.</div>}
              */}
            </div>
          </div>
        </aside>

        <aside className="flex w-[260px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f3f4f6] bg-white">
            <div className="flex h-12 items-center justify-between px-4">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><ChevronLeft size={16} className="text-gray-400" /><span>{searchQuery.trim() ? 'Search Result' : selectedNotebook?.name ?? (selectedNotebookId === UNCATEGORIZED_ID ? 'Uncategorized' : activeSpace?.name ?? 'General')}</span></div>
                <div className="flex items-center gap-2 text-gray-400">
                  <button
                    onClick={() => {
                      if (!canReorderNotes) {
                        return;
                      }
                      setIsReorderMode((current) => !current);
                      setDraggedNoteId(null);
                    }}
                    className={`rounded-md p-1 transition-colors hover:bg-gray-100 hover:text-gray-600 ${isReorderMode ? 'bg-blue-50 text-blue-600' : ''} ${!canReorderNotes ? 'opacity-40' : ''}`}
                    aria-label="Reorder notes"
                  >
                    <ArrowDownUp size={16} />
                  </button>
                  <div className="relative" ref={notebookOptionsRef}>
                    <button
                      onClick={() => {
                        if (!selectedNotebook) {
                          return;
                        }
                        setIsNotebookOptionsOpen((current) => !current);
                      }}
                      className={`rounded-md p-1 transition-colors hover:bg-gray-100 hover:text-gray-600 ${!selectedNotebook ? 'opacity-40' : ''}`}
                      aria-label="Notebook options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {isNotebookOptionsOpen && selectedNotebook && (
                      <div className="absolute right-0 top-10 z-30 w-[220px] rounded-2xl bg-[#1f1f21] p-2 text-sm text-white shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
                        <button onClick={openSubNotebookDialog} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/10">
                          <Plus size={16} className="text-gray-300" />
                          <span>New Sub Notebook</span>
                        </button>
                        <button onClick={openNotebookEditDialog} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/10">
                          <PencilLine size={16} className="text-gray-300" />
                          <span>Edit</span>
                        </button>
                        <button onClick={openDeleteNotebookDialog} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/10">
                          <Trash2 size={16} className="text-gray-300" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </div>
            {searchQuery.trim() && <div className="border-t border-[#f7f7f8] px-4 py-3 text-sm text-gray-500">Notes <span className="ml-1 text-gray-400">{filteredNotes.length}</span></div>}
          </div>
          {!searchQuery.trim() && selectedNotebook && childNotebooks.length > 0 && (
            <div className="border-b border-[#f3f4f6] px-4 py-2">
              {childNotebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => setSelectedNotebookId(notebook.id)}
                  className="flex w-full items-center justify-between border-b border-[#f3f4f6] py-2 text-left last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {renderCoverPreview(notebook.cover, notebook.name, 'h-8 w-8 rounded-md')}
                    <span className="truncate text-sm font-medium text-gray-800">{notebook.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{notebookCounts[notebook.name] ?? 0}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {filteredNotes.length > 0 ? filteredNotes.map((note) => (
              <div
                key={note.id}
                draggable={isReorderMode}
                onDragStart={(event) => {
                  if (!isReorderMode) {
                    return;
                  }
                  setDraggedNoteId(note.id);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', note.id);
                }}
                onDragOver={(event) => {
                  if (!isReorderMode || !draggedNoteId || draggedNoteId === note.id) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  if (!isReorderMode || !draggedNoteId) {
                    return;
                  }
                  event.preventDefault();
                  moveNote(draggedNoteId, note.id);
                  setDraggedNoteId(null);
                }}
                onDragEnd={() => setDraggedNoteId(null)}
                onClick={() => {
                  if (!isReorderMode) {
                    setActiveNoteId(note.id);
                  }
                }}
                className={`${isReorderMode ? 'cursor-grab' : 'cursor-pointer'} border-b p-4 ${draggedNoteId === note.id ? 'opacity-50' : ''} ${activeNoteId === note.id ? 'border-l-4 border-l-blue-500 bg-[#eff4ff]' : 'border-l-4 border-transparent bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 pr-4 text-sm font-bold leading-snug text-gray-800">{highlightText(note.title, searchQuery)}</h3>
                <div className="space-y-0.5 text-xs text-gray-500"><p>{note.author || '작성자 없음'}</p><p>{note.date}</p></div>
                {note.preview && <div className="mt-3 rounded border border-gray-100 bg-gray-50 p-2 text-[11px] text-gray-600">{highlightText(note.preview, searchQuery)}</div>}
              </div>
                  {isReorderMode && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400" aria-hidden="true">
                      <GripVertical size={18} />
                    </div>
                  )}
                </div>
              </div>
            )) : <div className="px-6 py-10 text-center text-sm text-gray-500">{searchQuery.trim() ? '검색 결과가 없습니다.' : '이 스페이스는 비어 있습니다.'}</div>}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="border-b border-[#f3f4f6] px-8 py-3 text-xs text-gray-400">{activeNote?.notebook ?? activeSpace?.name ?? 'Space'}</div>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {activeNote ? <div className="prose-editor max-w-[900px]"><EditorContent editor={editor} /></div> : <div className="flex h-full items-center justify-center"><div className="max-w-[420px] rounded-[28px] border border-dashed border-gray-200 bg-[#fafafa] px-8 py-10 text-center"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-500">Empty Space</p><h2 className="mt-3 text-2xl font-semibold text-gray-900">새 스페이스가 준비되었습니다</h2><p className="mt-3 text-sm leading-6 text-gray-500">기존 내용은 그대로 남아 있고, 여기서 만드는 새 노트와 노트북은 이 스페이스 안에서만 관리됩니다.</p></div></div>}
          </div>
        </main>
      </div>

      {isNotebookDialogOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#111111]/30 backdrop-blur-[1px]">
          <div className="w-[640px] rounded-[28px] bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900">{notebookDialogMode === 'edit' ? 'Edit Notebook' : 'Create New Notebook'}</h2>
                <p className="mt-2 text-sm text-gray-500">이 스페이스 아래에 새 노트북을 추가합니다.</p>
              </div>
              <button onClick={closeNotebookDialog} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-[96px_1fr] items-start gap-x-4 gap-y-6">
              <label htmlFor="notebook-name" className="pt-3 text-sm font-medium text-gray-700">Name</label>
              <div>
                <input id="notebook-name" autoFocus value={notebookNameInput} onChange={(event) => setNotebookNameInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSaveNotebook(); }} placeholder="Enter notebook name" className="w-full rounded-2xl border border-gray-200 bg-[#f7f7f8] px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <FolderClosed size={15} className="text-gray-400" />
                  <span>Notebooks</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>

              <div className="pt-2 text-sm font-medium text-gray-700">Lock</div>
              <div className="flex items-center gap-4 pt-1">
                <button onClick={() => setIsNotebookLocked((current) => !current)} className={`relative h-8 w-14 rounded-full transition-colors ${isNotebookLocked ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${isNotebookLocked ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-blue-600">Create Lock Password</span>
              </div>

              <div className="pt-2 text-sm font-medium text-gray-700">Cover</div>
              <div>
                <div className="grid grid-cols-5 gap-4">
                  {notebookCoverOptions.map((cover) => (
                    <button
                      key={cover}
                      onClick={() => setSelectedNotebookCover(cover)}
                      className={`overflow-hidden rounded-2xl border-2 transition-all ${selectedNotebookCover === cover ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]' : 'border-transparent hover:border-gray-200'}`}
                    >
                      {renderCoverPreview(cover, 'cover option', 'h-20 w-full')}
                    </button>
                  ))}
                  <button
                    onClick={() => notebookFileInputRef.current?.click()}
                    className={`flex h-20 items-center justify-center rounded-2xl border-2 border-dashed text-gray-400 transition-colors ${selectedNotebookCover.startsWith('data:') ? 'border-blue-500 bg-blue-50 text-blue-500' : 'border-gray-200 hover:border-blue-300 hover:text-blue-500'}`}
                  >
                    {selectedNotebookCover.startsWith('data:') ? (
                      renderCoverPreview(selectedNotebookCover, 'custom cover', 'h-full w-full')
                    ) : (
                      <Plus size={20} />
                    )}
                  </button>
                </div>
                <input ref={notebookFileInputRef} type="file" accept="image/*" onChange={handleNotebookCoverUpload} className="hidden" />
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button onClick={handleSaveNotebook} disabled={!notebookNameInput.trim()} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300">
                {notebookDialogMode === 'edit' ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteNotebookDialogOpen && selectedNotebook && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#111111]/30 backdrop-blur-[1px]">
          <div className="w-[360px] rounded-3xl border border-white/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">Delete</p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">Delete Notebook?</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">"{selectedNotebook.name}" 노트북을 삭제하시겠습니까? 포함된 노트는 `Uncategorized`로 이동됩니다.</p>
              </div>
              <button onClick={() => setIsDeleteNotebookDialogOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsDeleteNotebookDialogOpen(false)} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteNotebook} className="rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {spaceDialogMode && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#111111]/30 backdrop-blur-[1px]">
          <div className="w-[360px] rounded-3xl border border-white/60 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">Space</p><h2 className="mt-2 text-xl font-semibold text-gray-900">{spaceDialogMode === 'create' ? 'New Space' : 'Edit Space'}</h2><p className="mt-2 text-sm text-gray-500">가장 큰 메뉴에 표시할 이름을 입력하고 저장하세요.</p></div>
              <button onClick={() => { setSpaceDialogMode(null); setSpaceNameInput(''); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="mt-6">
              <label htmlFor="space-name" className="text-sm font-medium text-gray-700">Space Name</label>
              <input id="space-name" autoFocus value={spaceNameInput} onChange={(event) => setSpaceNameInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSaveSpace(); }} placeholder="예: 가이버" className="mt-2 w-full rounded-2xl border border-gray-200 bg-[#f9fafb] px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setSpaceDialogMode(null); setSpaceNameInput(''); }} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveSpace} disabled={!spaceNameInput.trim()} className="rounded-2xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-gray-300">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
