import { Container } from '@/components/layout/container';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function ForbiddenPage() {
  return (
    <Container size="md" className="py-16">
      <Card className="p-10 text-center">
        <h1 className="font-display text-5xl font-bold text-navy-800">403</h1>
        <h2 className="mt-3 text-xl font-semibold text-navy-800">دسترسی مجاز نیست</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          شما اجازه‌ی دسترسی به این بخش را ندارید.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild variant="primary">
            <Link href="/">بازگشت به خانه</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">پروفایل</Link>
          </Button>
        </div>
      </Card>
    </Container>
  );
}
