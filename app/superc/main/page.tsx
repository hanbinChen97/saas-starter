'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Search, Loader2, CheckCircle, Coffee } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { createUserProfile } from './actions';

export default function SuperCPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitComplete, setSubmitComplete] = useState(false);
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    phone: '',
    email: '',
    geburtsdatumDay: '',
    geburtsdatumMonth: '',
    geburtsdatumYear: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('vorname', formData.vorname);
      formDataObj.append('nachname', formData.nachname);
      formDataObj.append('phone', formData.phone);
      formDataObj.append('email', formData.email);
      formDataObj.append('geburtsdatumDay', formData.geburtsdatumDay);
      formDataObj.append('geburtsdatumMonth', formData.geburtsdatumMonth);
      formDataObj.append('geburtsdatumYear', formData.geburtsdatumYear);
      formDataObj.append('preferredLocations', JSON.stringify(['superc']));
      
      const result = await createUserProfile({}, formDataObj);

      if ('success' in result && result.success) {
        setSubmitComplete(true);
        setFormData({
          vorname: '',
          nachname: '',
          phone: '',
          email: '',
          geburtsdatumDay: '',
          geburtsdatumMonth: '',
          geburtsdatumYear: '',
        });
      } else if ('error' in result) {
        console.error('Validation error:', result.error);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/superc" className="flex items-center">
            <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">SuperC Anmeldung</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/superc" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Zurück zu SuperC
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">SuperC Anmeldung</h1>
            <p className="text-lg text-gray-600">Füllen Sie das Formular aus, um sich für SuperC zu registrieren</p>
          </div>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitComplete && (
                  <div className="flex items-center text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Anmeldung erfolgreich abgeschickt!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vorname">Vorname *</Label>
                    <Input
                      id="vorname"
                      name="vorname"
                      type="text"
                      value={formData.vorname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nachname">Nachname *</Label>
                    <Input
                      id="nachname"
                      name="nachname"
                      type="text"
                      value={formData.nachname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Geburtsdatum *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatumDay" className="text-sm">Tag</Label>
                      <Input
                        id="geburtsdatumDay"
                        name="geburtsdatumDay"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.geburtsdatumDay}
                        onChange={handleInputChange}
                        placeholder="DD"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatumMonth" className="text-sm">Monat</Label>
                      <Input
                        id="geburtsdatumMonth"
                        name="geburtsdatumMonth"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.geburtsdatumMonth}
                        onChange={handleInputChange}
                        placeholder="MM"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geburtsdatumYear" className="text-sm">Jahr</Label>
                      <Input
                        id="geburtsdatumYear"
                        name="geburtsdatumYear"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={formData.geburtsdatumYear}
                        onChange={handleInputChange}
                        placeholder="YYYY"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bevorzugter Standort</Label>
                  <div className="text-sm text-gray-600">SuperC (Standard)</div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    'Anmeldung absenden'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 打赏卡片 */}
          <Card className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Coffee className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gefällt Ihnen unser Service?
                </h3>
                <p className="text-gray-600 mb-4">
                  Wenn Sie mit unserem SuperC Service zufrieden sind, können Sie uns gerne einen Kaffee spendieren! ☕
                </p>
                <Button 
                  asChild
                  variant="outline"
                  className="bg-white hover:bg-orange-50 border-orange-300 text-orange-700 hover:text-orange-800"
                >
                  <a 
                    href="https://www.paypal.com/paypalme/SupaCAachen?locale.x=de_DE&country.x=DE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Einen Kaffee spendieren
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}