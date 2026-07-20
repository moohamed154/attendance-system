import { getDictionary } from '@/lib/i18n';
import { StudentLookup } from '@/components/student/StudentLookup';

export default async function StudentPortalLookupPage() {
  const dict = await getDictionary();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <StudentLookup dict={dict} />
      </div>
    </div>
  );
}
