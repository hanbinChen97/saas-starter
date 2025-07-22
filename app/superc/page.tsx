import { Button } from '@/app/components/ui/button';
import { ArrowRight, Search, FileText, Calendar, Users, Shield, Check, Euro } from 'lucide-react';
import Link from 'next/link';
import { Terminal } from './terminal';


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
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-orange-600 font-semibold tracking-wide uppercase">Preise</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Einfach und transparent
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Nur eine einmalige Gebühr für Ihre SuperC-Anmeldung
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-lg w-full">
              <div className="px-8 py-12 text-center">
                <div className="flex justify-center items-center mb-4">
                  <Euro className="h-8 w-8 text-orange-600 mr-2" />
                  <span className="text-5xl font-bold text-gray-900">10</span>
                  <span className="text-xl text-gray-500 ml-2">einmalig</span>
                </div>
                
                <div className="mb-6">
                  <p className="text-lg text-orange-600 font-semibold">💰 Eine Mahlzeit, unendlicher Komfort</p>
                  <p className="text-gray-500 mt-2">Was Sie für eine Mahlzeit ausgeben, investieren Sie in stressfreie SuperC-Anmeldung</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-left">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Automatische Terminsuche</span>
                  </div>
                  <div className="flex items-center text-left">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Sofortige Benachrichtigungen</span>
                  </div>
                  <div className="flex items-center text-left">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Kein Stress, keine Warteschlangen</span>
                  </div>
                  <div className="flex items-center text-left">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">24/7 Service verfügbar</span>
                  </div>
                </div>

                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 w-full">
                  <Link href="/superc/login">
                    Jetzt für 10€ starten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                <p className="text-sm text-gray-500 mt-4">
                  ✨ Einmalzahlung • Keine versteckten Kosten • Sofortiger Zugang
                </p>
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