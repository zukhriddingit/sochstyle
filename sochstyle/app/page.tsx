import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: barbers } = await supabase.from('barbers').select()

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Find Your Perfect Hairstyle
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Welcome to SochStyle, the best place to discover new hairstyles and connect with talented barbers.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/try-on">
            <Button>Try virtual styling</Button>
          </Link>
          <Link href="/barbers">
            <Button variant="outline">Browse barbers</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold">Our Barbers (from Supabase)</h2>
        <pre className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-auto">
          {JSON.stringify(barbers, null, 2)}
        </pre>
      </div>
    </section>
  );
}
