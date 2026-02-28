import Link from "next/link";
import { UseIcon } from "@hooks/use-icons";
import Header from "@common/footer";
import Footer from "@common/header";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6">
        <section className="text-center">
          <p className="text-base font-semibold text-blue-600">404</p>

          <h1 className="my-4 text-6xl tracking-tight font-extrabold sm:text-7xl">
            Página No <br />
            Encontrada
          </h1>

          <p className="max-w-xl mx-auto font-light text-gray-600 sm:text-xl leading-relaxed">
            Lo sentimos, no pudimos encontrar la página que estás buscando.
          </p>

          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-white bg-blue-700 rounded-sm hover:bg-blue-800 focus:ring-4 focus:ring-blue-300"
            >
              Volver al inicio
            </Link>

            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-300"
            >
              Contactar soporte
              <UseIcon name="arrow-up-left" className="size-4 rotate-y-180" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
