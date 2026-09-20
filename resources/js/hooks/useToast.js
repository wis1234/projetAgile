import toast from '@/lib/toast';

/**
 * Hook de notification : `const toast = useToast(); toast.error('…')`.
 * L'objet retourné est stable (pas de re-render inutile) et utilisable dans les callbacks Inertia.
 */
export default function useToast() {
    return toast;
}

export { toast };
