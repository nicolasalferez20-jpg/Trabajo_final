import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="p-4 sticky top-0 left-0 right-0 z-50 backdrop-blur-sm">
      <Link href="/" className="inline-block">
        <Image
          src="/favicon.svg"
          alt="COLSOF S.A.S"
          width={70}
          height={70}
          className="sm:size-18 size-12"
        />
      </Link>
    </header>
  );
}
