import React, { useState, useEffect } from 'react';
import {
  FaFolder,
  FaPlus,
  FaMinus,
  FaTimes,
  FaCheck,
  FaTag,
  FaPalette
} from 'react-icons/fa';
import { useUserId } from '@/context/UserIdContext';
import { useToast } from '@/components/ui/Toast';

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface AssetGroupManagerProps {
  assetIds: string[]; // Single asset or multiple assets
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Callback when groups are updated
}

interface GroupCheckboxProps {
  group: UserGroup;
  isChecked: boolean;
  isIndeterminate: boolean;
  onChange: (groupId: string, checked: boolean) => void;
  disabled?: boolean;
}

interface GroupCreateFormProps {
  onSave: (group: UserGroup) => void;
  onCancel: () => void;
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

const GroupCreateForm: React.FC<GroupCreateFormProps> = ({
  onSave,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const userId = useUserId();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color,
          userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create group');
      }

      onSave(result.group);

      showToast({
        type: 'image',
        prompt: `Group "${name}" created successfully!`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          placeholder="Enter group name"
          maxLength={50}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
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

      <div className="flex justify-end space-x-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </form>
  );
};

const GroupCheckbox: React.FC<GroupCheckboxProps> = ({
  group,
  isChecked,
  isIndeterminate,
  onChange,
  disabled = false
}) => {
  return (
    <label
      className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onChange(group.id, e.target.checked)}
          disabled={disabled}
          className="w-4 h-4"
          ref={(el) => {
            if (el) {
              el.indeterminate = isIndeterminate;
            }
          }}
        />
      </div>
      <FaFolder style={{ color: group.color }} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{group.name}</div>
        {group.description && (
          <div className="text-sm text-gray-500 truncate">
            {group.description}
          </div>
        )}
      </div>
    </label>
  );
};

const AssetGroupManager: React.FC<AssetGroupManagerProps> = ({
  assetIds,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [assetGroupMemberships, setAssetGroupMemberships] = useState<{
    [assetId: string]: string[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    [groupId: string]: boolean;
  }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const userId = useUserId();
  const { showToast } = useToast();

  const fetchGroupsAndMemberships = async () => {
    if (!userId || assetIds.length === 0) return;

    setLoading(true);
    try {
      // Fetch all user groups
      const groupsResponse = await fetch(`/api/groups?userId=${userId}`);
      const groupsResult = await groupsResponse.json();

      if (!groupsResponse.ok) {
        throw new Error(groupsResult.error || 'Failed to fetch groups');
      }

      setGroups(groupsResult.groups || []);

      // Fetch group memberships for each asset
      const membershipPromises = assetIds.map(async (assetId) => {
        const response = await fetch(
          `/api/groups/assets?assetId=${assetId}&userId=${userId}`
        );
        const result = await response.json();

        if (response.ok) {
          return { assetId, groupIds: result.groupIds || [] };
        } else {
          console.error(
            `Failed to fetch groups for asset ${assetId}:`,
            result.error
          );
          return { assetId, groupIds: [] };
        }
      });

      const memberships = await Promise.all(membershipPromises);
      const membershipMap: { [assetId: string]: string[] } = {};

      memberships.forEach(({ assetId, groupIds }) => {
        membershipMap[assetId] = groupIds;
      });

      setAssetGroupMemberships(membershipMap);
    } catch (error) {
      console.error('Error fetching groups and memberships:', error);
      showToast({
        type: 'error',
        prompt: `Failed to load groups: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroupsAndMemberships();
      setPendingChanges({});
      setShowCreateForm(false);
    }
  }, [isOpen, userId, assetIds]);

  const getGroupMembershipStatus = (groupId: string) => {
    const assetsInGroup = assetIds.filter((assetId) =>
      assetGroupMemberships[assetId]?.includes(groupId)
    );

    if (assetsInGroup.length === 0) {
      return { isChecked: false, isIndeterminate: false };
    } else if (assetsInGroup.length === assetIds.length) {
      return { isChecked: true, isIndeterminate: false };
    } else {
      return { isChecked: false, isIndeterminate: true };
    }
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setPendingChanges((prev) => ({
      ...prev,
      [groupId]: checked
    }));
  };

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const promises: Promise<any>[] = [];

      for (const [groupId, shouldBeInGroup] of Object.entries(pendingChanges)) {
        const { isChecked } = getGroupMembershipStatus(groupId);

        if (shouldBeInGroup && !isChecked) {
          // Add assets to group
          promises.push(
            fetch('/api/groups/assets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assetIds,
                groupIds: [groupId],
                userId
              })
            })
          );
        } else if (
          !shouldBeInGroup &&
          (isChecked || getGroupMembershipStatus(groupId).isIndeterminate)
        ) {
          // Remove assets from group
          promises.push(
            fetch('/api/groups/assets', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assetIds,
                groupIds: [groupId],
                userId
              })
            })
          );
        }
      }

      const results = await Promise.all(promises);

      // Check if all operations succeeded
      const failedOperations = results.filter((response) => !response.ok);

      if (failedOperations.length > 0) {
        throw new Error(`${failedOperations.length} operation(s) failed`);
      }

      showToast({
        type: 'image',
        prompt: `Successfully updated group memberships for ${assetIds.length} asset(s)!`,
        duration: 3000
      });

      if (onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (error) {
      console.error('Error updating group memberships:', error);
      showToast({
        type: 'error',
        prompt: `Failed to update groups: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const getEffectiveGroupStatus = (groupId: string) => {
    if (pendingChanges.hasOwnProperty(groupId)) {
      // Use pending change
      return {
        isChecked: pendingChanges[groupId],
        isIndeterminate: false
      };
    } else {
      // Use current status
      return getGroupMembershipStatus(groupId);
    }
  };

  const handleCreateGroup = (newGroup: UserGroup) => {
    // Add the new group to the list
    setGroups([newGroup, ...groups]);
    // Automatically check the new group for the current assets
    setPendingChanges((prev) => ({
      ...prev,
      [newGroup.id]: true
    }));
    // Hide the create form
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FaTag />
            <h2 className="text-lg font-semibold">Add to Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          {!showCreateForm ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {assetIds.length === 1
                    ? 'Select groups for this asset:'
                    : `Select groups for ${assetIds.length} assets:`}
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  title="Create new group"
                  disabled={saving}
                >
                  <FaPlus className="text-xs" />
                  New Group
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">No groups available.</div>
                  <div className="text-sm">
                    Create your first group to organize assets.
                  </div>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {groups.map((group) => {
                    const effectiveStatus = getEffectiveGroupStatus(group.id);
                    return (
                      <GroupCheckbox
                        key={group.id}
                        group={group}
                        isChecked={effectiveStatus.isChecked}
                        isIndeterminate={effectiveStatus.isIndeterminate}
                        onChange={handleGroupToggle}
                        disabled={saving}
                      />
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create a new group for your assets:
              </div>
              <GroupCreateForm
                onSave={handleCreateGroup}
                onCancel={handleCancelCreate}
              />
            </>
          )}
        </div>

        {!showCreateForm && groups.length > 0 && (
          <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(pendingChanges).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <FaCheck className="text-sm" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetGroupManager;
