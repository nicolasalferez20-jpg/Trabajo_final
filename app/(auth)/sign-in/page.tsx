import SignInCard from "@ui/sign-in-card";
import Header from "@common/header";
import Footer from "@common/footer";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center px-4">
        <SignInCard />
      </main>
      <Footer />
    </div>
  );
}
