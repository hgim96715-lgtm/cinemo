import { Suspense } from 'react';
import { PostcardPageContent } from './PostcardPageContent';
import '../styles/common.css';
import '../styles/confirm-modal.css';
import '../styles/postcard.css';

export default function PostcardPage() {
  return (
    <Suspense fallback={null}>
      <PostcardPageContent />
    </Suspense>
  );
}
