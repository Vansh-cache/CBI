import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { apiPost } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors, getColorPalette } from '../../lib/themeColors';

// Mobile detection hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

interface ZohoAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Just refresh callback
}

export default function ZohoAPIModal({ isOpen, onClose, onSave }: ZohoAPIModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    name: '',
    zohoService: 'crm',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    region: 'com',
    apiVersion: 'v2',
    modules: [] as string[],
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [autoFetch, setAutoFetch] = useState(true);

  if (!isOpen) return null;

  const zohoServices = [
    { value: 'crm', label: 'Zoho CRM' },
    { value: 'books', label: 'Zoho Books' },
    { value: 'analytics', label: 'Zoho Analytics' },
    { value: 'people', label: 'Zoho People' },
    { value: 'projects', label: 'Zoho Projects' },
  ];

  const crmModules = ['Leads', 'Contacts', 'Accounts', 'Deals', 'Tasks', 'Calls', 'Meetings'];
  const booksModules = ['Invoices', 'Bills', 'Customers', 'Vendors', 'Items', 'Expenses'];

  const getModulesForService = () => {
    if (formData.zohoService === 'crm') return crmModules;
    if (formData.zohoService === 'books') return booksModules;
    return [];
  };

  const toggleModule = (module: string) => {
    setFormData({
      ...formData,
      modules: formData.modules.includes(module)
        ? formData.modules.filter((m) => m !== module)
        : [...formData.modules, module],
    });
  };

  const getZohoBaseUrl = () => {
    const domain = formData.region === 'com' ? 'com' : formData.region;
    return `https://www.zohoapis.${domain}`;
  };

  const getZohoEndpoint = () => {
    const serviceMap: Record<string, string> = {
      crm: '/crm',
      books: '/books',
      analytics: '/analytics',
      people: '/people',
      projects: '/projects',
    };
    const servicePath = serviceMap[formData.zohoService] || '/crm';
    return `${servicePath}/api/${formData.apiVersion}`;
  };

  const handleTestConnection = async () => {
    if (!formData.name || !formData.clientId || !formData.clientSecret) {
      setTestStatus('error');
      setTestMessage('Please provide name, Client ID, and Client Secret');
      return;
    }

    setTestStatus('loading');
    setTestMessage('Testing Zoho connection...');

    try {
      const baseUrl = getZohoBaseUrl();
      const endpoint = getZohoEndpoint();

      // Use direct test endpoint
      const testRes = await apiPost<{ message: string }>('/api/admin/api-configs/test', {
        base_url: baseUrl,
        endpoint: endpoint || '',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        auth_type: 'bearer',
        auth_config: {
          token: formData.refreshToken || 'test-token',
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
        },
        timeout_ms: 30000,
      });

      if (testRes.success) {
        setTestStatus('success');
        setTestMessage(testRes.message || 'Zoho API connection test successful!');
      } else {
        setTestStatus('error');
        setTestMessage(testRes.message || 'Connection test failed');
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage(e instanceof Error ? e.message : 'Connection test failed');
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name || !formData.clientId || !formData.clientSecret) {
      setTestStatus('error');
      setTestMessage('Please fill in all required fields.');
      return;
    }

    setSavingDraft(true);
    setTestMessage('');

    try {
      const baseUrl = getZohoBaseUrl();
      const endpoint = getZohoEndpoint();

      // Create API config (save as draft - no data fetch)
      const configRes = await apiPost<{ id: number }>('/api/admin/api-configs', {
        name: formData.name,
        base_url: baseUrl,
        endpoint: endpoint,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        auth_type: 'bearer',
        auth_config: {
          token: formData.refreshToken || '',
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
          zoho_service: formData.zohoService,
          modules: formData.modules,
        },
        rate_limit_per_minute: 60,
        timeout_ms: 30000,
      });

      if (!configRes.success || !configRes.data) {
        throw new Error(configRes.message || 'Failed to create Zoho API configuration');
      }

      // Refresh data sources list
      onSave();
      onClose();
    } catch (e) {
      setTestStatus('error');
      setTestMessage(e instanceof Error ? e.message : 'Failed to save configuration');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.clientId || !formData.clientSecret) {
      setTestStatus('error');
      setTestMessage('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    setTestMessage('');

    try {
      const baseUrl = getZohoBaseUrl();
      const endpoint = getZohoEndpoint();

      // Create API config
      const configRes = await apiPost<{ id: number }>('/api/admin/api-configs', {
        name: formData.name,
        base_url: baseUrl,
        endpoint: endpoint,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        auth_type: 'bearer',
        auth_config: {
          token: formData.refreshToken || '',
          client_id: formData.clientId,
          client_secret: formData.clientSecret,
          zoho_service: formData.zohoService,
          modules: formData.modules,
        },
        rate_limit_per_minute: 60,
        timeout_ms: 30000,
      });

      if (!configRes.success || !configRes.data) {
        throw new Error(configRes.message || 'Failed to create Zoho API configuration');
      }

      const apiConfigId = (configRes.data as { id: number }).id;

      // Optionally fetch data to create dataset
      if (autoFetch) {
        try {
          await apiPost('/api/data/fetch-api', {
            api_config_id: apiConfigId,
            dataset_name: formData.name,
            description: `Zoho ${formData.zohoService} data`,
          });
        } catch (e) {
          console.error('Failed to fetch initial data:', e);
          // Continue even if fetch fails
        }
      }

      // Refresh data sources list
      onSave();
      onClose();
    } catch (e) {
      setTestStatus('error');
      setTestMessage(e instanceof Error ? e.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: isMobile ? '0' : '1rem' }}>
      <div style={{ backgroundColor: colors.cardBg, borderRadius: isMobile ? '1rem 1rem 0 0' : '0.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: isMobile ? '100%' : '42rem', maxHeight: isMobile ? '95vh' : '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '1rem' : '1rem 1.5rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.0625rem' : '1.25rem', fontWeight: 600, color: colors.text }}>Connect Zoho API</h2>
            {!isMobile && <p style={{ fontSize: '0.875rem', color: colors.muted, marginTop: '0.25rem' }}>Configure Zoho service integration</p>}
          </div>
          <button
            onClick={onClose}
            style={{ padding: '0.25rem', color: colors.muted, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
          {/* Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: 600, color: colors.text }}>Basic Information</h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Data Source Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Zoho CRM - Sales Data"
                style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Zoho Service <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.zohoService}
                onChange={(e) =>
                  setFormData({ ...formData, zohoService: e.target.value, modules: [] })
                }
                style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
              >
                {zohoServices.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* OAuth Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: 600, color: colors.text }}>OAuth 2.0 Configuration</h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Client ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="1000.XXXXXXXXXXXXXXXXXXXXXXXXXX"
                style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text, fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Client Secret <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                placeholder="Enter your client secret"
                style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text, fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Refresh Token
              </label>
              <input
                type="password"
                value={formData.refreshToken}
                onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                placeholder="Optional: Enter refresh token"
                style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text, fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: colors.muted, marginTop: '0.25rem' }}>
                If not provided, you'll need to authorize via OAuth flow
              </p>
            </div>
          </div>

          {/* Region & API Version */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontWeight: 600, color: colors.text }}>Configuration</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Data Center</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                >
                  <option value="com">US (.com)</option>
                  <option value="eu">Europe (.eu)</option>
                  <option value="in">India (.in)</option>
                  <option value="com.au">Australia (.com.au)</option>
                  <option value="jp">Japan (.jp)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>API Version</label>
                <select
                  value={formData.apiVersion}
                  onChange={(e) => setFormData({ ...formData, apiVersion: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 1rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', outline: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                >
                  <option value="v2">Version 2</option>
                  <option value="v3">Version 3 (if available)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modules Selection */}
          {getModulesForService().length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontWeight: 600, color: colors.text }}>
                Select {formData.zohoService === 'crm' ? 'CRM' : 'Books'} Modules
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {getModulesForService().map((module) => (
                  <label
                    key={module}
                    style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.modules.includes(module)}
                      onChange={() => toggleModule(module)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: colors.text }}>{module}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Auto-fetch option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: palette.blue.bg, borderRadius: '0.5rem' }}>
            <input
              type="checkbox"
              id="autoFetchZoho"
              checked={autoFetch}
              onChange={(e) => setAutoFetch(e.target.checked)}
              style={{ width: '1rem', height: '1rem' }}
            />
            <label htmlFor="autoFetchZoho" style={{ fontSize: '0.875rem', color: colors.text }}>
              Automatically fetch data after creating configuration (creates dataset)
            </label>
          </div>

          {/* Instructions */}
          <div style={{ backgroundColor: palette.blue.bg, border: `1px solid ${isDark ? '#1e40af' : '#bfdbfe'}`, borderRadius: '0.5rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: palette.blue.text, marginBottom: '0.5rem' }}>
              How to get Zoho API credentials:
            </h4>
            <ol style={{ fontSize: '0.75rem', color: palette.blue.text, paddingLeft: '1rem', listStyleType: 'decimal', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Go to Zoho API Console (api-console.zoho.{formData.region})</li>
              <li>Create a new "Server-based Application"</li>
              <li>Copy the Client ID and Client Secret</li>
              <li>Set the Redirect URI to your callback URL</li>
              <li>Generate a Refresh Token using the OAuth flow</li>
            </ol>
          </div>

          {/* Status Messages */}
          {testStatus === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: palette.green.text, backgroundColor: palette.green.bg, padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
              <CheckCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              {testMessage}
            </div>
          )}

          {testStatus === 'error' && testMessage && (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: palette.red.text, backgroundColor: palette.red.bg, padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              {testMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', padding: isMobile ? '1rem' : '1rem 1.5rem', borderTop: `1px solid ${colors.cardBorder}`, backgroundColor: colors.tableBg, gap: isMobile ? '0.75rem' : '0' }}>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'loading'}
            style={{ padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: testStatus === 'loading' ? 0.5 : 1, transition: 'background-color 0.2s', fontSize: isMobile ? '0.9375rem' : '1rem' }}
          >
            {testStatus === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Test
          </button>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '0.75rem' }}>
            {!isMobile && (
              <button
                onClick={onClose}
                disabled={saving || savingDraft}
                style={{ padding: '0.5rem 1rem', color: colors.text, backgroundColor: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', opacity: (saving || savingDraft) ? 0.5 : 1, transition: 'background-color 0.2s' }}
              >
                Cancel
              </button>
            )}
            {!isMobile && (
              <button
                onClick={handleSaveDraft}
                disabled={saving || savingDraft}
                style={{ padding: '0.5rem 1rem', color: colors.muted, border: `1px solid ${colors.inputBorder}`, borderRadius: '0.5rem', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (saving || savingDraft) ? 0.5 : 1, transition: 'background-color 0.2s' }}
              >
                {savingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
                Save as Draft
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || savingDraft}
              style={{ padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (saving || savingDraft) ? 0.5 : 1, transition: 'background-color 0.2s', width: isMobile ? '100%' : 'auto', fontSize: isMobile ? '0.9375rem' : '1rem' }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save & Fetch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
