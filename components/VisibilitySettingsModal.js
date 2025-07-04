import { useState, useEffect } from 'react';
import styles from '../styles/settings.module.css'; // Reuse settings styles

export default function VisibilitySettingsModal({ isOpen, onClose, settings, onSave, visibilityFields }) {
  const [editedSettings, setEditedSettings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize editedSettings when modal opens or settings change
    if (isOpen && settings) { // Ensure settings is available
      const initialSettings = {};
      visibilityFields.forEach(field => {
        const userSetting = settings[field.name];
        initialSettings[field.name] = userSetting ? { // Use existing setting if available
          visibleToAdminOnly: userSetting.visibleToAdminOnly || false,
          visibleToFollowersOnly: userSetting.visibleToFollowersOnly || false,
          visibleToAll: userSetting.visibleToAll || false, // Default to false if not set
        } : { // Provide default settings if no user setting found for the field
          visibleToAdminOnly: false,
          visibleToFollowersOnly: false,
          visibleToAll: true, // Default to visible to all
        };
      });
      setEditedSettings(initialSettings);
    } else if (isOpen) { // If modal is open but settings are not yet loaded
        // Optionally initialize with all fields visible to all as a fallback
         const defaultSettings = {};
         visibilityFields.forEach(field => {
             defaultSettings[field.name] = {
                 visibleToAdminOnly: false,
                 visibleToFollowersOnly: false,
                 visibleToAll: true,
             };
         });
         setEditedSettings(defaultSettings);
    }
  }, [isOpen, settings, visibilityFields]); // Added visibilityFields to dependencies

  if (!isOpen) return null;

  const handleSettingChange = (fieldName, option) => {
    setEditedSettings(prev => ({
      ...prev,
      [fieldName]: {
        visibleToAdminOnly: option === 'admin',
        visibleToFollowersOnly: option === 'followers',
        visibleToAll: option === 'all',
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(editedSettings); // Call the onSave function passed from parent
    setSaving(false);
    // Do not close modal here, let parent decide based on save success
  };

  return (
    <div className={styles.modalOverlay}> {/* Reuse modalOverlay style */}
      <div className={styles.modalContent}> {/* Reuse modalContent style */}
        <div className={styles.modalHeader}> {/* Reuse modalHeader style */}
          <h2>可见性设置</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button> {/* Reuse closeButton style */}
        </div>
        <div className={styles.modalBody}> {/* Reuse modalBody style */}
          <div className={styles.settingsList}> {/* Reuse settingsList style */}
            {visibilityFields.map(field => (
              <div key={field.name} className={styles.settingItem}> {/* Reuse settingItem style */}
                <label className={styles.settingLabel}>{field.label}:</label>
                <div className={styles.settingOptions}> {/* Reuse settingOptions style */}
                  <label>
                    <input
                      type="radio"
                      value="all"
                      checked={editedSettings[field.name]?.visibleToAll === true}
                      onChange={() => handleSettingChange(field.name, 'all')}
                      disabled={saving}
                    />
                    对所有人可见
                  </label>
                  {field.name !== 'blocked_list' && (
                     <label>
                       <input
                         type="radio"
                         value="followers"
                         checked={editedSettings[field.name]?.visibleToFollowersOnly === true}
                         onChange={() => handleSettingChange(field.name, 'followers')}
                         disabled={saving}
                       />
                       仅对关注者可见
                     </label>
                  )}
                   <label>
                     <input
                       type="radio"
                       value="admin"
                       checked={editedSettings[field.name]?.visibleToAdminOnly === true}
                       onChange={() => handleSettingChange(field.name, 'admin')}
                       disabled={saving}
                     />
                     仅对管理员可见
                   </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}> {/* Add a modal footer style */}
          <button onClick={handleSave} disabled={saving} className={styles.saveButton}> {/* Reuse saveButton style */}
            {saving ? '保存中...' : '保存'}
          </button>
          {/* Optionally add a cancel button */}
          {/* <button onClick={onClose} disabled={saving} className={styles.cancelButton}>取消</button> */} 
        </div>
      </div>
    </div>
  );
} 