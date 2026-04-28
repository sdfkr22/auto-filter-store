import { getCurrentUser } from "@/lib/auth/user";
import StoreHeader from "./StoreHeader";

// Server wrapper: kullanıcıyı / displayName'i çeker, client header'a aktarır.
// React.cache ile request başına tek kez çalışır.
export default async function StoreHeaderShell({
  showProductsLink = true,
}: {
  showProductsLink?: boolean;
}) {
  const user = await getCurrentUser();
  return (
    <StoreHeader
      user={user ? { displayName: user.displayName } : null}
      showProductsLink={showProductsLink}
    />
  );
}
