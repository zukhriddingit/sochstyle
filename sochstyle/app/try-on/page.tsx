import VirtualTryOn from '@/components/VirtualTryOn';

export default function TryOnPage() {
  return (
    <section className="container py-8 md:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Virtual Try-On</h1>
        <p className="max-w-2xl text-muted-foreground">
          See hairstyles on your face in real time. Choose a style and keep your
          forehead visible for the best alignment.
        </p>
      </div>
      <VirtualTryOn />
    </section>
  );
}
