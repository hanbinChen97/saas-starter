import { Button } from '@/app/components/ui/button';
import { ArrowRight, Search, FileText, Calendar, Users, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SuperCLandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Welcome to 
                <span className="block text-orange-600">SuperC Registration</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Vereinfachen Sie Ihre SuperC-Anmeldung mit unserem intelligenten Registrierungssystem. 
                Schnell, sicher und benutzerfreundlich.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                  <Link href="/superc/login">
                    Jetzt Registrieren
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/">
                    Zurück zur Startseite
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-orange-50 to-red-100 px-6 py-8">
                    <div className="flex items-center justify-center">
                      <div className="bg-orange-600 p-3 rounded-full">
                        <Search className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">
                      SuperC Anmeldung
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      Schnelle und einfache Registrierung für SuperC Services
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-orange-600 font-semibold tracking-wide uppercase">Funktionen</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Alles was Sie für Ihre SuperC-Anmeldung brauchen
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Unser System macht die SuperC-Registrierung einfach und effizient.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Einfache Formulare</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Übersichtliche und benutzerfreundliche Registrierungsformulare, 
                  die alle erforderlichen Informationen erfassen.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Search className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Intelligente Suche</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Automatisierte Terminsuche und -buchung für verfügbare SuperC-Termine.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Calendar className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Terminmanagement</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Verwalten Sie Ihre SuperC-Termine und erhalten Sie automatische 
                  Benachrichtigungen über Verfügbarkeiten.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Sicher & Datenschutz</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Ihre persönlichen Daten werden sicher gespeichert und gemäß 
                  DSGVO-Richtlinien verarbeitet.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Standort-Auswahl</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Wählen Sie Ihren bevorzugten SuperC-Standort für optimale 
                  Terminverfügbarkeit.
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Schneller Prozess</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Registrierung in wenigen Minuten abgeschlossen. 
                  Sofortige Bestätigung und Statusupdates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Bereit für Ihre SuperC-Anmeldung?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Starten Sie jetzt mit Ihrer SuperC-Registrierung. Unser System führt Sie 
                Schritt für Schritt durch den gesamten Anmeldeprozess.
              </p>
              <div className="mt-8 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                  <Link href="/superc/login">
                    Anmeldung Starten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/">
                    Zurück zur Startseite
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <div className="bg-gradient-to-br from-orange-50 to-red-100 p-8 rounded-lg">
                <div className="flex items-center justify-center space-x-4">
                  <div className="bg-orange-600 p-4 rounded-full">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">SuperC</div>
                    <div className="text-sm text-gray-600">Registrierungssystem</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}