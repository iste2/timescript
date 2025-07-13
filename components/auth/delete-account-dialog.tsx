'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { deleteAccount } from '@/lib/server/auth-actions';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function DeleteAccountDialog({ isOpen, onClose, userEmail }: DeleteAccountDialogProps) {
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmationEmail !== userEmail) {
      setError('Email confirmation does not match your account email');
      return;
    }

    if (!hasConfirmed) {
      setError('Please confirm that you understand your account will be permanently deleted');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await deleteAccount(confirmationEmail);
      // The server action will redirect to login, so we won't reach here on success
    } catch (error: any) {
      setError(error.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationEmail('');
      setHasConfirmed(false);
      setError('');
      onClose();
    }
  };

  const isValid = confirmationEmail === userEmail && hasConfirmed;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              <strong>This action cannot be undone.</strong> This will permanently delete your account and all associated data including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Your user settings and preferences</li>
              <li>All column definitions and values</li>
              <li>All slash commands</li>
              <li>All generated time entries</li>
              <li>Your account profile</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-confirmation">
              Type your email address <strong>{userEmail}</strong> to confirm:
            </Label>
            <Input
              id="email-confirmation"
              type="email"
              value={confirmationEmail}
              onChange={(e) => setConfirmationEmail(e.target.value)}
              placeholder={userEmail}
              disabled={isDeleting}
              className={confirmationEmail && confirmationEmail !== userEmail ? 'border-destructive' : ''}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-deletion"
              checked={hasConfirmed}
              onCheckedChange={(checked) => setHasConfirmed(checked === true)}
              disabled={isDeleting}
            />
            <Label htmlFor="confirm-deletion" className="text-sm">
              I understand that this action is permanent and cannot be undone
            </Label>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || isDeleting}
          >
            {isDeleting ? 'Deleting Account...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}