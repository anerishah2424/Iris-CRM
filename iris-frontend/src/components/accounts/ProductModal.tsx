import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAllProducts, useAddAccountProduct, useUpdateAccountProduct } from '@/hooks/useAccounts';
import type { InstalledProduct } from '@/types/product';
import type { Product } from '@/types/product';

const schema = z.object({
  product_id: z.coerce.number().min(1, 'Select a product'),
  quantity: z.coerce.number().min(1, 'Min 1'),
  installed_version: z.string().optional(),
  installation_date: z.string().optional(),
  license_expiry: z.string().optional(),
  license_type: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  accountId: number;
  product?: InstalledProduct; // If provided, we are editing
}

export function ProductModal({ open, onClose, accountId, product }: ProductModalProps) {
  const { data: allProducts } = useAllProducts();
  const products: Product[] = Array.isArray(allProducts) ? allProducts : [];
  
  const addProduct = useAddAccountProduct(accountId);
  const updateProduct = useUpdateAccountProduct(accountId, product?.install_id ?? 0);

  const isEdit = !!product;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    values: product ? {
      product_id: product.product_id,
      quantity: product.quantity,
      installed_version: product.installed_version ?? '',
      installation_date: product.install_date ?? '',
      license_expiry: product.license_expiry ?? '',
      license_type: product.license_type ?? '',
      notes: (product as any).notes ?? '',
    } : undefined,
  });

  const onSubmit = async (data: any) => {
    if (isEdit) {
      await updateProduct.mutateAsync(data);
    } else {
      await addProduct.mutateAsync(data);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-matrix-navy">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-matrix-paleBlue">
                <X size={18} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label">Select Product *</label>
                <select {...register('product_id')} className="input" disabled={isEdit}>
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      [{p.domain}] {p.product_name}
                    </option>
                  ))}
                </select>
                {errors.product_id && <p className="text-[12px] text-health-red mt-1">{errors.product_id.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantity *</label>
                  <input {...register('quantity')} type="number" className="input" />
                </div>
                <div>
                  <label className="label">Version</label>
                  <input {...register('installed_version')} placeholder="e.g. v2.4.1" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Installation Date</label>
                  <input {...register('installation_date')} type="date" className="input" />
                </div>
                <div>
                  <label className="label">License Expiry</label>
                  <input {...register('license_expiry')} type="date" className="input" />
                </div>
              </div>

              <div>
                <label className="label">License Type</label>
                <select {...register('license_type')} className="input">
                  <option value="">N/A</option>
                  <option value="Annual">Annual</option>
                  <option value="Perpetual">Perpetual</option>
                  <option value="Subscription">Subscription</option>
                </select>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Deployment details…" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button 
                  type="submit" 
                  disabled={addProduct.isPending || updateProduct.isPending} 
                  className="btn-primary min-w-[120px]"
                >
                  {(addProduct.isPending || updateProduct.isPending) ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Saving…</>
                  ) : isEdit ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
