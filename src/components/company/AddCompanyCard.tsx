import * as React from 'react';
import { X, UploadCloud, Plus } from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AddCompanyForm = {
  companyName: string;
  website: string;
  phone: string;
  industry: string;
  country: string;
  address: string;
  logoFile?: File;
};

export function AddCompanyCard() {
  const [form, setForm] = React.useState<AddCompanyForm>({
    companyName: '',
    website: '',
    phone: '',
    industry: '',
    country: '',
    address: '',
  });

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function update<K extends keyof AddCompanyForm>(key: K, value: AddCompanyForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  function onFileSelected(file?: File) {
    if (!file) return;
    update('logoFile', file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    onFileSelected(file);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Hook this up to your API
    // eslint-disable-next-line no-console
    console.log('Add company payload:', form);
  }

  return (
    <Card className='w-full max-w-[820px]'>
      <CardHeader>
        <CardTitle>Add New Company</CardTitle>
        <Button variant='ghost' size='icon' aria-label='Close'>
          <X className='h-4 w-4 text-primary' />
        </Button>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Company Logo</Label>

            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFileSelected(e.target.files?.[0])}
            />

            <div
              role='button'
              tabIndex={0}
              onClick={onPickFile}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className='flex w-full flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-border p-8 text-center'
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(13,26,99,0.1)]'>
                <UploadCloud className='h-5 w-5 text-primary' />
              </div>

              <div className='text-sm font-bold text-primary'>
                Click to upload or drag and drop
              </div>

              <div className='text-xs font-medium text-primary'>
                SVG, PNG, JPG or GIF (max. 800x400px)
              </div>

              {form.logoFile ? (
                <div className='mt-2 text-xs text-slate-600'>Selected: {form.logoFile.name}</div>
              ) : null}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='companyName'>Company Name</Label>
              <Input
                id='companyName'
                placeholder='e.g. Acme Corp'
                value={form.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('companyName', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='website'>Website</Label>
              <Input
                id='website'
                placeholder='test@cmpany.com'
                value={form.website}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('website', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                placeholder='+200000000000'
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('phone', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v: string) => update('industry', v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Marketing Agency' />
                </SelectTrigger>
                <SelectContent>
                  {['Marketing Agency', 'Software', 'Retail', 'Healthcare', 'Education'].map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v: string) => update('country', v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select country' />
                </SelectTrigger>
                <SelectContent>
                  {['Egypt', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait'].map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address</Label>
              <Input
                id='address'
                placeholder='Cairo - Egypt'
                value={form.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('address', e.target.value)}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type='button' variant='outline'>
            Cancel
          </Button>
          <Button type='submit' className='min-w-[155px]'>
            <Plus className='h-4 w-4' />
            Add Company
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
