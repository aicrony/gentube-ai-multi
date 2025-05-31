import React, { useState, useEffect } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFolder,
  FaFolderOpen,
  FaTimes,
  FaPalette,
  FaPlay,
  FaCog
} from 'react-icons/fa';
import { useUserId } from '@/context/UserIdContext';
import { useToast } from '@/components/ui/Toast';

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
  assetCount?: number;
}

interface GroupManagerProps {
  onGroupSelect?: (groupId: string | null) => void;
  selectedGroupId?: string | null;
  showCreateButton?: boolean;
  compact?: boolean;
  onStartGroupSlideshow?: (groupId: string) => void;
  onOpenGroupSlideshowSettings?: (groupId: string) => void;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: UserGroup | null;
  onSave: (group: UserGroup) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280' // Gray
];

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  group,
  onSave
}) => {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [color, setColor] = useState(group?.color || PRESET_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const userId = useUserId();
  const { showToast } = useToast();

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setColor(group.color || PRESET_COLORS[0]);
    } else {
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
    }
    setError('');
  }, [group, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = group ? '/api/groups' : '/api/groups';
      const method = group ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...(group && { groupId: group.id }),
          name: name.trim(),
          description: description.trim(),
          color,
          userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save group');
      }

      onSave(result.group);
      onClose();

      showToast({
        type: 'image',
        prompt: `Group "${name}" ${group ? 'updated' : 'created'} successfully!`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving group:', error);
      setError(error instanceof Error ? error.message : 'Failed to save group');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {group ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              placeholder="Enter group name"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              placeholder="Optional description"
              rows={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <FaPalette className="inline mr-1" />
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === presetColor
                      ? 'border-gray-800 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-600'
                  } transition-transform`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : group ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GroupManager: React.FC<GroupManagerProps> = ({
  onGroupSelect,
  selectedGroupId,
  showCreateButton = true,
  compact = false,
  onStartGroupSlideshow,
  onOpenGroupSlideshowSettings
}) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const userId = useUserId();
  const { showToast } = useToast();

  const fetchGroups = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/groups?userId=${userId}`);
      const result = await response.json();

      if (response.ok) {
        setGroups(result.groups || []);
      } else {
        console.error('Failed to fetch groups:', result.error);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [userId]);

  const handleGroupSave = (savedGroup: UserGroup) => {
    if (editingGroup) {
      // Update existing group
      setGroups(groups.map((g) => (g.id === savedGroup.id ? savedGroup : g)));
    } else {
      // Add new group
      setGroups([savedGroup, ...groups]);
    }
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (group: UserGroup) => {
    if (
      !confirm(
        `Are you sure you want to delete the group "${group.name}"? This will remove all assets from this group.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/groups?groupId=${group.id}&userId=${userId}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        setGroups(groups.filter((g) => g.id !== group.id));

        // If this was the selected group, clear selection
        if (selectedGroupId === group.id && onGroupSelect) {
          onGroupSelect(null);
        }

        showToast({
          type: 'image',
          prompt: `Group "${group.name}" deleted successfully!`,
          duration: 3000
        });
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      showToast({
        type: 'error',
        prompt: `Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading groups...</div>;
  }

  return (
    <div className={`group-manager ${compact ? 'compact' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Asset Groups</h3>
        {showCreateButton && (
          <button
            onClick={handleCreateGroup}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            title="Create new group"
          >
            <FaPlus className="text-xs" />
            {!compact && 'New'}
          </button>
        )}
      </div>

      <div className="space-y-1">
        {/* All Assets option */}
        <button
          onClick={() => onGroupSelect?.(null)}
          className={`w-full text-left p-2 rounded text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
            selectedGroupId === null
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <FaFolderOpen className="text-gray-500" />
            <span>All Assets</span>
          </div>
        </button>

        {/* Group list */}
        {groups.map((group) => (
          <div
            key={group.id}
            className={`group flex items-center justify-between p-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
              selectedGroupId === group.id
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
          >
            <button
              onClick={() => onGroupSelect?.(group.id)}
              className="flex-1 text-left flex items-center gap-2"
            >
              <FaFolder
                style={{ color: group.color }}
                className="flex-shrink-0"
              />
              <span className="truncate" title={group.name}>
                {group.name}
              </span>
              {group.assetCount !== undefined && (
                <span className="text-xs text-gray-500">
                  ({group.assetCount})
                </span>
              )}
            </button>

            {!compact && (
              <div className="flex items-center gap-1">
                {group.assetCount && group.assetCount > 0 && (
                  <>
                    <button
                      onClick={() => onStartGroupSlideshow?.(group.id)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Start slideshow for this group"
                    >
                      <FaPlay className="text-xs" />
                    </button>
                    <button
                      onClick={() => onOpenGroupSlideshowSettings?.(group.id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Open slideshow settings for this group"
                    >
                      <FaCog className="text-xs" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleEditGroup(group)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Edit group"
                >
                  <FaEdit className="text-xs" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete group"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            No groups yet.
            {showCreateButton && (
              <>
                <br />
                <button
                  onClick={handleCreateGroup}
                  className="text-blue-600 hover:text-blue-700 mt-1"
                >
                  Create your first group
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        group={editingGroup}
        onSave={handleGroupSave}
      />
    </div>
  );
};

export default GroupManager;
