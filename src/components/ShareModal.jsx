'use client'

import React, { useState } from 'react';
import { X, Link2, RefreshCw, Check, Copy, Lock, Clock, AlertCircle, User, Shield, Share2 } from 'lucide-react';

export default function ShareModal({ projectName, clientName, slides, contactName, contactEmail, contactPhone, onContactNameChange, onContactEmailChange, onContactPhoneChange, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(null);
  const [error, setError] = useState(null);

  const generateShareLink = async () => {
    if (slides.length === 0) {
      setError('No slides to share');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: projectName || 'Untitled Proposal',
          clientName: clientName || '',
          slides,
          password: usePassword ? password : null,
          expiresInDays,
          contactName: contactName || '',
          contactEmail: contactEmail || '',
          contactPhone: contactPhone || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      const fullUrl = `${window.location.origin}${data.url}`;
      setShareUrl(fullUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError('Failed to copy to clipboard');
    }
  };

  // Success State
  if (shareUrl) {
    return (
      <div className="fixed inset-0 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-scale" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-tertiary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-text-primary font-medium text-sm">Share Link Created</h2>
                <p className="text-text-tertiary text-xs">Ready to share with your client</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* URL Display */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Proposal Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-bg-tertiary border border-border rounded-xl">
                  <Link2 className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-text-primary text-sm font-mono focus:outline-none truncate"
                  />
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                    copied 
                      ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                      : 'bg-accent text-white hover:bg-accent-secondary hover:shadow-glow'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link Settings Summary */}
            <div className="grid grid-cols-2 gap-3">
              {usePassword && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-status-warning-subtle border border-status-warning/20 rounded-lg">
                  <Lock className="w-3.5 h-3.5 text-status-warning" />
                  <span className="text-xs text-status-warning font-medium">Password Protected</span>
                </div>
              )}
              {expiresInDays && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-xs text-text-secondary">Expires in {expiresInDays} days</span>
                </div>
              )}
              {!usePassword && !expiresInDays && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-tertiary border border-border rounded-lg">
                  <Check className="w-3.5 h-3.5 text-status-success" />
                  <span className="text-xs text-text-secondary">No restrictions</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShareUrl('');
                  setPassword('');
                  setUsePassword(false);
                  setExpiresInDays(null);
                }}
                className="flex-1 py-2.5 bg-surface-hover hover:bg-surface-active text-text-secondary hover:text-text-primary rounded-xl text-sm font-medium transition-all"
              >
                Create New Link
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-accent hover:bg-accent-secondary text-white rounded-xl text-sm font-medium transition-all hover:shadow-glow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Link State
  return (
    <div className="fixed inset-0 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-tertiary/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-text-primary font-medium">Share Proposal</h2>
              <p className="text-text-tertiary text-xs">{clientName || 'Untitled Project'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* No slides warning */}
          {slides.length === 0 && (
            <div className="p-4 bg-status-warning-subtle border border-status-warning/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-status-warning font-medium text-sm">No proposal to share</p>
                <p className="text-status-warning/70 text-xs mt-1">Generate a proposal first before sharing.</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              Your Contact Information
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={contactName || ''}
                onChange={(e) => onContactNameChange(e.target.value)}
                placeholder="Your name"
                className="px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-sm placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none transition-all"
              />
              <input
                type="email"
                value={contactEmail || ''}
                onChange={(e) => onContactEmailChange(e.target.value)}
                placeholder="Your email"
                className="px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-sm placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none transition-all"
              />
            </div>
            <input
              type="tel"
              value={contactPhone || ''}
              onChange={(e) => onContactPhoneChange(e.target.value)}
              placeholder="Your phone (optional)"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-sm placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none transition-all"
            />
            <p className="text-xs text-text-muted">This will be shown on the closing slide of the shared proposal.</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Security Options */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Security & Access
            </label>

            {/* Password Toggle */}
            <div className="space-y-3">
              <button
                onClick={() => setUsePassword(!usePassword)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  usePassword 
                    ? 'bg-accent-subtle border-accent/30' 
                    : 'bg-bg-tertiary border-border hover:border-border-strong'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${usePassword ? 'bg-accent/20' : 'bg-surface-hover'}`}>
                    <Lock className={`w-5 h-5 ${usePassword ? 'text-accent' : 'text-text-tertiary'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${usePassword ? 'text-accent' : 'text-text-primary'}`}>Password Protection</p>
                    <p className="text-xs text-text-muted">Require password to view</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  usePassword ? 'bg-accent border-accent' : 'border-text-muted'
                }`}>
                  {usePassword && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>

              {usePassword && (
                <div className="animate-fade-in">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    autoFocus
                    className="w-full px-4 py-3 bg-bg-tertiary border border-accent/30 rounded-xl text-text-primary text-sm placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <p className="text-xs text-text-muted">Link expires after:</p>
              <div className="flex gap-2">
                {[
                  { label: 'Never', value: null },
                  { label: '7d', value: 7 },
                  { label: '30d', value: 30 },
                  { label: '90d', value: 90 }
                ].map(option => (
                  <button
                    key={option.label}
                    onClick={() => setExpiresInDays(option.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      expiresInDays === option.value
                        ? 'bg-accent text-white shadow-glow'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-status-error-subtle border border-status-error/20 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-status-error text-sm">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateShareLink}
            disabled={isGenerating || slides.length === 0 || (usePassword && !password.trim())}
            className="w-full py-4 bg-accent hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:shadow-glow"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Creating share link...</span>
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5" />
                <span>Generate Share Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
