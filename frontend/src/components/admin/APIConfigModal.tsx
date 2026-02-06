import { useState, useEffect } from 'react';
import { X, Link2, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiPost, apiGet, apiPut } from '../../lib/api';
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

interface ApiConfig {
  id: number;
  name: string;
  base_url: string;
  endpoint: string | null;
  method: string;
  headers: string | object;
  auth_type: string;
  auth_config: string | object;
  rate_limit_per_minute: number;
  timeout_ms: number;
}

interface APIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Just refresh callback
  editingConfig?: ApiConfig | null; // Config to edit
}

export default function APIConfigModal({ isOpen, onClose, onSave, editingConfig }: APIConfigModalProps) {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    name: '',
    method: 'GET',
    url: '',
    endpoint: '',
    headers: [{ key: '', value: '' }],
    queryParams: [{ key: '', value: '' }],
    bodyType: 'none',
    body: '',
    authType: 'none',
    authToken: '',
    authUsername: '',
    authPassword: '',
    apiKeyHeader: '',
    responseDataPath: '',
    refreshInterval: '',
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [autoFetch, setAutoFetch] = useState(true);
  const [isCustomHeader, setIsCustomHeader] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showBearerToken, setShowBearerToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Theme support
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const palette = getColorPalette(isDark);

  // Load config for editing
  useEffect(() => {
    if (editingConfig && isOpen) {
      const loadConfig = async () => {
        try {
          const res = await apiGet<ApiConfig>(`/api/admin/api-configs/${editingConfig.id}`);
          if (res.success && res.data) {
            const config = res.data;
            // Parse headers
            let headersObj: Record<string, string> = {};
            try {
              if (typeof config.headers === 'string') {
                headersObj = JSON.parse(config.headers || '{}');
              } else if (typeof config.headers === 'object') {
                headersObj = config.headers as Record<string, string>;
              }
            } catch { }

            // Parse auth config
            let authConfig: Record<string, string> = {};
            try {
              if (typeof config.auth_config === 'string') {
                authConfig = JSON.parse(config.auth_config || '{}');
              } else if (typeof config.auth_config === 'object') {
                authConfig = config.auth_config as Record<string, string>;
              }
            } catch { }

            // Build URL - split into base URL and endpoint for display
            setFormData({
              name: config.name,
              method: config.method || '',
              url: config.base_url || '',
              endpoint: config.endpoint || '',
              headers: Object.keys(headersObj).length > 0
                ? Object.entries(headersObj).map(([key, value]) => ({ key, value }))
                : [{ key: '', value: '' }],
              queryParams: [{ key: '', value: '' }],
              bodyType: 'none',
              body: '',
              authType: config.auth_type || 'none',
              authToken: authConfig.token || authConfig.key || '',
              authUsername: authConfig.username || '',
              authPassword: authConfig.password || '',
              apiKeyHeader: authConfig.header_name || '',
              responseDataPath: '',
              refreshInterval: String(config.rate_limit_per_minute || 60),
            });
            // Check if loaded header name is custom (not in predefined list)
            const predefinedHeaders = [
              'X-API-Key', 'X-Api-Key', 'X-API-KEY', 'Api-Key', 'API-Key',
              'X-Auth-Token', 'X-AuthToken', 'X-Token', 'Authorization',
              'api-key', 'apikey', 'X-RapidAPI-Key', 'X-Application-Key',
              'X-Client-Key', 'X-Secret-Key', 'X-Access-Key', 'X-Project-Key',
              'X-Subscription-Key', 'Ocp-Apim-Subscription-Key'
            ];
            const loadedHeader = authConfig.header_name || '';
            setIsCustomHeader(loadedHeader !== '' && !predefinedHeaders.includes(loadedHeader));
          }
        } catch (e) {
          console.error('Failed to load config:', e);
        }
      };
      loadConfig();
    } else if (!editingConfig && isOpen) {
      // Reset form for new config
      setFormData({
        name: '',
        method: '',
        url: '',
        endpoint: '',
        headers: [{ key: '', value: '' }],
        queryParams: [{ key: '', value: '' }],
        bodyType: 'none',
        body: '',
        authType: 'none',
        authToken: '',
        authUsername: '',
        authPassword: '',
        apiKeyHeader: '',
        responseDataPath: '',
        refreshInterval: '',
      });
      setIsCustomHeader(false);
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [editingConfig, isOpen]);

  if (!isOpen) return null;

  const addHeader = () => {
    setFormData({
      ...formData,
      headers: [...formData.headers, { key: '', value: '' }],
    });
  };

  const removeHeader = (index: number) => {
    setFormData({
      ...formData,
      headers: formData.headers.filter((_, i) => i !== index),
    });
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...formData.headers];
    newHeaders[index][field] = value;
    setFormData({ ...formData, headers: newHeaders });
  };

  const addQueryParam = () => {
    setFormData({
      ...formData,
      queryParams: [...formData.queryParams, { key: '', value: '' }],
    });
  };

  const removeQueryParam = (index: number) => {
    setFormData({
      ...formData,
      queryParams: formData.queryParams.filter((_, i) => i !== index),
    });
  };

  const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...formData.queryParams];
    newParams[index][field] = value;
    setFormData({ ...formData, queryParams: newParams });
  };

  const handleTestConnection = async () => {
    if (!formData.url) {
      setTestStatus('error');
      setTestMessage('Please provide a URL.');
      return;
    }

    if (!formData.method || formData.method.trim() === '') {
      setTestStatus('error');
      setTestMessage('Please select an HTTP method.');
      return;
    }

    setTestStatus('loading');
    setTestMessage('Testing connection...');

    try {
      // Build headers object
      const headersObj: Record<string, string> = {};
      formData.headers.forEach((h) => {
        if (h.key && h.value) headersObj[h.key] = h.value;
      });

      // Build auth config
      let authConfig: Record<string, string> = {};
      let authType = formData.authType || 'none';

      if (formData.authType === 'bearer' && formData.authToken) {
        authConfig = { token: formData.authToken };
        authType = 'bearer';
      } else if (formData.authType === 'api_key' && formData.authToken) {
        // Require header name - no defaults
        if (!formData.apiKeyHeader || formData.apiKeyHeader.trim() === '') {
          setTestStatus('error');
          setTestMessage('Header name is required for API key authentication');
          return;
        }
        authConfig = { key: formData.authToken, header_name: formData.apiKeyHeader.trim() };
        authType = 'api_key';
      } else if (formData.authType === 'basic' && formData.authUsername && formData.authPassword) {
        authConfig = { username: formData.authUsername, password: formData.authPassword };
        authType = 'basic';
      } else {
        authType = 'none';
      }

      // Use EXACT URL as provided - NO parsing, NO splitting, NO modification
      // User provides full URL or base_url + endpoint separately
      const baseUrl = formData.url.trim();
      const endpoint = formData.endpoint ? formData.endpoint.trim() : '';

      // Build query string from form params if provided
      const queryParams = formData.queryParams.filter(p => p.key && p.value);
      let queryString = '';
      if (queryParams.length > 0) {
        queryString = '?' + queryParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
      }
      // Append query string to endpoint if provided, otherwise to base URL
      const finalEndpoint = endpoint + queryString;

      // Debug logging - show exactly what we're sending
      console.log('Frontend sending to backend:', {
        base_url: baseUrl,
        endpoint: finalEndpoint,
        method: formData.method || 'GET',
        auth_type: authType,
        auth_config: authConfig,
        hasAuthConfig: Object.keys(authConfig).length > 0,
        headers: Object.keys(headersObj).length > 0 ? Object.keys(headersObj) : 'none',
        formAuthType: formData.authType,
        apiKeyHeader: formData.apiKeyHeader,
        authToken: formData.authToken ? '***SET***' : 'NOT SET'
      });

      // Use direct test endpoint (doesn't create config)
      const testRes = await apiPost<{
        message: string;
        data?: {
          status: number;
          statusText?: string;
          url?: string;
          method?: string;
          headers?: string[];
          responseData?: unknown;
        };
        error?: string;
        details?: unknown;
      }>(
        '/api/admin/api-configs/test',
        {
          base_url: baseUrl,
          endpoint: finalEndpoint,
          method: formData.method.trim().toUpperCase(), // Use EXACT method from form - NO default
          headers: Object.keys(headersObj).length > 0 ? headersObj : {},
          auth_type: authType,
          auth_config: Object.keys(authConfig).length > 0 ? authConfig : (authType !== 'none' ? {} : undefined),
          timeout_ms: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval) * 1000
            : 30000, // Use form timeout if provided
        }
      );

      if (testRes.success) {
        setTestStatus('success');
        setTestMessage(testRes.message || 'Connection successful!');
      } else {
        setTestStatus('error');
        // Show EXACT error details from API - no masking
        let errorMsg = testRes.message || 'Connection test failed';

        // Add request details (nested under data.data from API)
        const requestDetails = testRes.data?.data;
        if (requestDetails) {
          errorMsg += `\n\nRequest Details:`;
          errorMsg += `\nStatus: ${requestDetails.status} ${requestDetails.statusText || ''}`;
          if (requestDetails.url) errorMsg += `\nURL: ${requestDetails.url}`;
          if (requestDetails.method) errorMsg += `\nMethod: ${requestDetails.method}`;
          if (requestDetails.headers && requestDetails.headers.length > 0) {
            errorMsg += `\nHeaders: ${requestDetails.headers.join(', ')}`;
          }
          if (requestDetails.responseData) {
            try {
              const responseStr = typeof requestDetails.responseData === 'string'
                ? requestDetails.responseData
                : JSON.stringify(requestDetails.responseData);
              errorMsg += `\nResponse: ${responseStr.substring(0, 500)}`;
            } catch {
              errorMsg += `\nResponse: ${String(requestDetails.responseData).substring(0, 500)}`;
            }
          }
        }

        // Add error details if available (nested under data.details from API)
        const detailsObj = testRes.data?.details;
        if (detailsObj) {
          const details = detailsObj as Record<string, unknown>;
          errorMsg += `\n\nError Details:`;
          if (details.status) errorMsg += `\nHTTP Status: ${details.status} ${details.statusText || ''}`;
          if (details.url) errorMsg += `\nRequested URL: ${details.url}`;
          if (details.method) errorMsg += `\nRequest Method: ${details.method}`;
          if (details.responseData !== undefined) {
            try {
              const responseStr = typeof details.responseData === 'string'
                ? details.responseData
                : JSON.stringify(details.responseData);
              errorMsg += `\nAPI Response: ${responseStr.substring(0, 500)}`;
            } catch {
              errorMsg += `\nAPI Response: ${String(details.responseData).substring(0, 500)}`;
            }
          }
        }

        setTestMessage(errorMsg);
      }
    } catch (e) {
      setTestStatus('error');
      // Show exact error
      const errorMsg = e instanceof Error ? e.message : 'Connection test failed';
      setTestMessage(`Error: ${errorMsg}`);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name || !formData.url) {
      setTestStatus('error');
      setTestMessage('Please provide a name and URL.');
      return;
    }

    if (!formData.method || formData.method.trim() === '') {
      setTestStatus('error');
      setTestMessage('Please select an HTTP method.');
      return;
    }

    setSavingDraft(true);
    setTestMessage('');

    try {
      // Build headers object
      const headersObj: Record<string, string> = {};
      formData.headers.forEach((h) => {
        if (h.key && h.value) headersObj[h.key] = h.value;
      });

      // Build auth config
      let authConfig: Record<string, string> = {};
      let authType = formData.authType || 'none';

      if (formData.authType === 'bearer' && formData.authToken) {
        authConfig = { token: formData.authToken };
        authType = 'bearer';
      } else if (formData.authType === 'api_key' && formData.authToken) {
        // Require header name - no defaults
        if (!formData.apiKeyHeader || formData.apiKeyHeader.trim() === '') {
          setTestStatus('error');
          setTestMessage('Header name is required for API key authentication');
          return;
        }
        authConfig = { key: formData.authToken, header_name: formData.apiKeyHeader.trim() };
        authType = 'api_key';
      } else if (formData.authType === 'basic' && formData.authUsername && formData.authPassword) {
        authConfig = { username: formData.authUsername, password: formData.authPassword };
        authType = 'basic';
      } else {
        authType = 'none';
      }

      // Use EXACT values - NO URL parsing or modification
      const baseUrl = formData.url.trim();

      // Build endpoint with query params if provided
      let endpoint = formData.endpoint ? formData.endpoint.trim() : '';
      const queryParams = formData.queryParams.filter(p => p.key && p.value);
      if (queryParams.length > 0) {
        const queryString = '?' + queryParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
        endpoint = endpoint + queryString;
      }

      // Create or update API config (save as draft - no data fetch)
      if (editingConfig) {
        const updateRes = await apiPut(`/api/admin/api-configs/${editingConfig.id}`, {
          name: formData.name,
          base_url: baseUrl,
          endpoint: endpoint || null,
          method: formData.method.trim().toUpperCase(), // Use EXACT method from form
          headers: Object.keys(headersObj).length > 0 ? headersObj : null,
          auth_type: authType,
          auth_config: Object.keys(authConfig).length > 0 ? authConfig : null,
          rate_limit_per_minute: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10)
            : 60, // Use form value if provided
          timeout_ms: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10) * 1000
            : 30000, // Use form timeout if provided (convert seconds to ms)
        });
        if (!updateRes.success) {
          throw new Error(updateRes.message || 'Failed to update configuration');
        }
      } else {
        const configRes = await apiPost<{ id: number }>('/api/admin/api-configs', {
          name: formData.name,
          base_url: baseUrl,
          endpoint: endpoint || null,
          method: formData.method.trim().toUpperCase(), // Use EXACT method from form
          headers: Object.keys(headersObj).length > 0 ? headersObj : null,
          auth_type: authType,
          auth_config: Object.keys(authConfig).length > 0 ? authConfig : null,
          rate_limit_per_minute: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10)
            : 60, // Use form value if provided
          timeout_ms: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10) * 1000
            : 30000, // Use form timeout if provided (convert seconds to ms)
        });

        if (!configRes.success || !configRes.data) {
          throw new Error(configRes.message || 'Failed to save configuration');
        }
      }

      // Refresh data sources list to show new config
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
    if (!formData.name || !formData.url) {
      setTestStatus('error');
      setTestMessage('Please provide a name and URL.');
      return;
    }

    setSaving(true);
    setTestMessage('');

    try {
      // Build headers object
      const headersObj: Record<string, string> = {};
      formData.headers.forEach((h) => {
        if (h.key && h.value) headersObj[h.key] = h.value;
      });

      // Build auth config
      let authConfig: Record<string, string> = {};
      let authType = formData.authType || 'none';

      if (formData.authType === 'bearer' && formData.authToken) {
        authConfig = { token: formData.authToken };
        authType = 'bearer';
      } else if (formData.authType === 'api_key' && formData.authToken) {
        // Require header name - no defaults
        if (!formData.apiKeyHeader || formData.apiKeyHeader.trim() === '') {
          setTestStatus('error');
          setTestMessage('Header name is required for API key authentication');
          return;
        }
        authConfig = { key: formData.authToken, header_name: formData.apiKeyHeader.trim() };
        authType = 'api_key';
      } else if (formData.authType === 'basic' && formData.authUsername && formData.authPassword) {
        authConfig = { username: formData.authUsername, password: formData.authPassword };
        authType = 'basic';
      } else {
        authType = 'none';
      }

      // Use EXACT values - NO URL parsing or modification
      const baseUrl = formData.url.trim();

      // Build endpoint with query params if provided
      let endpoint = formData.endpoint ? formData.endpoint.trim() : '';
      const queryParams = formData.queryParams.filter(p => p.key && p.value);
      if (queryParams.length > 0) {
        const queryString = '?' + queryParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
        endpoint = endpoint + queryString;
      }

      // Create or update API config
      let apiConfigId: number;
      if (editingConfig) {
        const updateRes = await apiPut<{ id: number }>(`/api/admin/api-configs/${editingConfig.id}`, {
          name: formData.name,
          base_url: baseUrl,
          endpoint: endpoint || null,
          method: formData.method.trim().toUpperCase(), // Use EXACT method from form
          headers: Object.keys(headersObj).length > 0 ? headersObj : null,
          auth_type: authType,
          auth_config: Object.keys(authConfig).length > 0 ? authConfig : null,
          rate_limit_per_minute: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10)
            : 60, // Use form value if provided
          timeout_ms: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10) * 1000
            : 30000, // Use form timeout if provided (convert seconds to ms)
        });
        if (!updateRes.success) {
          throw new Error(updateRes.message || 'Failed to update API configuration');
        }
        apiConfigId = editingConfig.id;
      } else {
        const configRes = await apiPost<{ id: number }>('/api/admin/api-configs', {
          name: formData.name,
          base_url: baseUrl,
          endpoint: endpoint || null,
          method: formData.method.trim().toUpperCase(), // Use EXACT method from form
          headers: Object.keys(headersObj).length > 0 ? headersObj : null,
          auth_type: authType,
          auth_config: Object.keys(authConfig).length > 0 ? authConfig : null,
          rate_limit_per_minute: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10)
            : 60, // Use form value if provided
          timeout_ms: formData.refreshInterval && formData.refreshInterval.trim() !== ''
            ? parseInt(formData.refreshInterval, 10) * 1000
            : 30000, // Use form timeout if provided (convert seconds to ms)
        });

        if (!configRes.success || !configRes.data) {
          throw new Error(configRes.message || 'Failed to create API configuration');
        }

        apiConfigId = (configRes.data as { id: number }).id;
      }

      // Optionally fetch data to create dataset
      if (autoFetch) {
        try {
          await apiPost('/api/data/fetch-api', {
            api_config_id: apiConfigId,
            dataset_name: formData.name,
            description: `Data from ${formData.name} API`,
          });
        } catch (e) {
          console.error('Failed to fetch initial data:', e);
          // Continue even if fetch fails - config is created
        }
      }

      // Refresh data sources list to show new config
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style={{ padding: isMobile ? '0' : '1rem', alignItems: isMobile ? 'flex-end' : 'center' }}>
      <div
        style={{
          backgroundColor: colors.cardBg,
          boxShadow: colors.cardShadow,
          borderRadius: isMobile ? '1rem 1rem 0 0' : '0.5rem',
          width: '100%',
          maxWidth: isMobile ? '100%' : '48rem',
          maxHeight: isMobile ? '95vh' : '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '1rem' : '1rem 1.5rem',
            borderBottom: `1px solid ${colors.cardBorder}`
          }}
        >
          <h2 style={{ fontSize: isMobile ? '1.0625rem' : '1.25rem', fontWeight: 600, color: colors.text }}>
            {editingConfig ? 'Edit API Config' : 'Configure API'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem',
              color: colors.muted,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '0.25rem'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.5rem' }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Basic Information</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Data Source Name <span style={{ color: palette.red }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Customer API"
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    outline: 'none'
                  }}
                  required
                >
                  <option value="" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Select method...</option>
                  <option value="GET" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>GET</option>
                  <option value="POST" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>POST</option>
                  <option value="PUT" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>PUT</option>
                  <option value="DELETE" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>DELETE</option>
                </select>
              </div>
              <div className="col-span-3">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                  API URL <span style={{ color: palette.red }}>*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => {
                    const fullUrl = e.target.value;
                    // Auto-parse URL: if full URL is provided, split into base URL and endpoint
                    try {
                      const urlObj = new URL(fullUrl);
                      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
                      const endpoint = urlObj.pathname + urlObj.search;

                      setFormData({
                        ...formData,
                        url: baseUrl,
                        endpoint: endpoint || formData.endpoint // Only update if endpoint exists in URL
                      });
                    } catch {
                      // If URL parsing fails, just update the URL field
                      setFormData({ ...formData, url: fullUrl });
                    }
                  }}
                  placeholder="Enter API URL (e.g., https://api.yourservice.com/data)"
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    outline: 'none'
                  }}
                />
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: colors.muted }}>
                  Enter full URL to auto-split into base URL and endpoint
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                Endpoint (optional, if not in URL)
              </label>
              <input
                type="text"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="/api/v1/data"
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Authentication */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Authentication</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Auth Type</label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
              >
                <option value="none" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>None</option>
                <option value="bearer" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Bearer Token</option>
                <option value="basic" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Basic Auth</option>
                <option value="api_key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>API Key</option>
              </select>
            </div>

            {formData.authType === 'bearer' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Bearer Token</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showBearerToken ? 'text' : 'password'}
                    value={formData.authToken}
                    onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                    placeholder="Enter your bearer token"
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      paddingRight: '2.5rem',
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: '0.5rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowBearerToken(!showBearerToken)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: colors.muted,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label={showBearerToken ? 'Hide bearer token' : 'Show bearer token'}
                  >
                    {showBearerToken ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {formData.authType === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Username</label>
                  <input
                    type="text"
                    value={formData.authUsername}
                    onChange={(e) => setFormData({ ...formData, authUsername: e.target.value })}
                    placeholder="Username"
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: '0.5rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.authPassword}
                      onChange={(e) => setFormData({ ...formData, authPassword: e.target.value })}
                      placeholder="Password"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        paddingRight: '2.5rem',
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: colors.muted,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {formData.authType === 'api_key' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                    API Key <span style={{ color: palette.red }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.authToken}
                      onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                      placeholder="Enter your API key"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        paddingRight: '2.5rem',
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: colors.muted,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: colors.text, marginBottom: '0.5rem' }}>
                    Header Name <span style={{ color: palette.red }}>*</span>
                  </label>
                  <select
                    value={isCustomHeader ? '__custom__' : formData.apiKeyHeader}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomHeader(true);
                        setFormData({ ...formData, apiKeyHeader: '' });
                      } else {
                        setIsCustomHeader(false);
                        setFormData({ ...formData, apiKeyHeader: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: '0.5rem',
                      outline: 'none'
                    }}
                    required
                  >
                    <option value="" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Select header name...</option>
                    <option value="X-API-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-API-Key</option>
                    <option value="X-Api-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Api-Key</option>
                    <option value="X-API-KEY" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-API-KEY</option>
                    <option value="Api-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Api-Key</option>
                    <option value="API-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>API-Key</option>
                    <option value="X-Auth-Token" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Auth-Token</option>
                    <option value="X-AuthToken" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-AuthToken</option>
                    <option value="X-Token" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Token</option>
                    <option value="Authorization" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Authorization</option>
                    <option value="api-key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>api-key</option>
                    <option value="apikey" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>apikey</option>
                    <option value="X-RapidAPI-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-RapidAPI-Key</option>
                    <option value="X-Application-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Application-Key</option>
                    <option value="X-Client-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Client-Key</option>
                    <option value="X-Secret-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Secret-Key</option>
                    <option value="X-Access-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Access-Key</option>
                    <option value="X-Project-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Project-Key</option>
                    <option value="X-Subscription-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>X-Subscription-Key</option>
                    <option value="Ocp-Apim-Subscription-Key" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Ocp-Apim-Subscription-Key</option>
                    <option value="__custom__" style={{ backgroundColor: isDark ? '#1a1a2e' : '#ffffff', color: isDark ? '#f1f5f9' : '#1e293b' }}>Custom (enter below)</option>
                  </select>
                  {isCustomHeader && (
                    <input
                      type="text"
                      value={formData.apiKeyHeader}
                      onChange={(e) => setFormData({ ...formData, apiKeyHeader: e.target.value })}
                      placeholder="Enter custom header name (e.g., My-Custom-Header)"
                      style={{
                        width: '100%',
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        border: `1px solid ${colors.inputBorder}`,
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                  )}
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: colors.muted }}>
                    Select from common header names or choose "Custom" to enter your own
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Headers */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600, color: colors.text }}>Headers</h3>
              <button
                onClick={addHeader}
                style={{ fontSize: '0.875rem', color: palette.red, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Add Header
              </button>
            </div>

            {formData.headers.map((header, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Header value"
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={() => removeHeader(index)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    color: palette.red,
                    background: 'none',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Auto-fetch option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: `${palette.blue}20`,
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <input
              type="checkbox"
              id="autoFetch"
              checked={autoFetch}
              onChange={(e) => setAutoFetch(e.target.checked)}
              style={{ width: '1rem', height: '1rem' }}
            />
            <label htmlFor="autoFetch" style={{ fontSize: '0.875rem', color: colors.text }}>
              Automatically fetch data after creating configuration (creates dataset)
            </label>
          </div>

          {/* Status Messages */}
          {testStatus === 'success' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: palette.green,
              backgroundColor: `${palette.green}20`,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <CheckCircle className="w-5 h-5 mr-2" />
              {testMessage}
            </div>
          )}

          {testStatus === 'error' && testMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: palette.red,
              backgroundColor: `${palette.red}20`,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle className="w-5 h-5 mr-2" />
              {testMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1rem 1.5rem',
          borderTop: `1px solid ${colors.cardBorder}`,
          backgroundColor: colors.tableBg,
          gap: isMobile ? '0.75rem' : '0'
        }}>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'loading'}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
              color: palette.red,
              border: `1px solid ${palette.red}`,
              borderRadius: '0.5rem',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: testStatus === 'loading' ? 0.5 : 1,
              fontSize: isMobile ? '0.9375rem' : '1rem'
            }}
          >
            {testStatus === 'loading' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            Test
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: isMobile ? 'column' : 'row' }}>
            {!isMobile && (
              <button
                onClick={onClose}
                disabled={saving || savingDraft}
                style={{
                  padding: '0.5rem 1rem',
                  color: colors.text,
                  background: 'none',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  opacity: (saving || savingDraft) ? 0.5 : 1
                }}
              >
                Cancel
              </button>
            )}
            {!isMobile && (
              <button
                onClick={handleSaveDraft}
                disabled={saving || savingDraft}
                style={{
                  padding: '0.5rem 1rem',
                  color: colors.muted,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: '0.5rem',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: (saving || savingDraft) ? 0.5 : 1
                }}
              >
                {savingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
                Save as Draft
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || savingDraft}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (saving || savingDraft) ? 0.5 : 1,
                width: isMobile ? '100%' : 'auto',
                fontSize: isMobile ? '0.9375rem' : '1rem'
              }}
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
