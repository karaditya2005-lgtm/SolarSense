import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MessageSquare, User, Send, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { publicApi } from '../../api/public.ts';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.ts';
import { Input } from '../../components/ui/Input.tsx';
import { Textarea } from '../../components/ui/Textarea.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { Reveal } from '../../components/ui/Reveal.tsx';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email cannot exceed 255 characters'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150, 'Subject cannot exceed 150 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message cannot exceed 2000 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const Contact: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSuccessMessage(null);
    setServerError(null);

    try {
      await publicApi.submitContact(data);
      setSuccessMessage('Thank you for reaching out! Your inquiry has been submitted to the SolarSense project team.');
      reset();
    } catch (err) {
      const generalMsg = getErrorMessage(err, 'Unable to submit your inquiry. Please try again.');
      setServerError(generalMsg);

      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, msg]) => {
        if (field in data) {
          setError(field as keyof ContactFormData, { message: msg });
        }
      });
    }
  };

  return (
    <div className="w-full pt-28 md:pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
          <Reveal direction="up" delay={150}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Get in Touch with <span className="text-emerald-600 dark:text-emerald-400">SolarSense</span>
            </h1>
          </Reveal>
          <Reveal direction="up" delay={250}>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Have questions regarding our meteorological models, machine learning architecture,
              or integration opportunities? Send a message directly to the development team.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7">
            <Reveal direction="left" delay={200}>
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl dark:shadow-none">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Send an Inquiry</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Fill in your details below. Messages are saved securely and reviewed by project administrators.
                </p>

                {successMessage && (
                  <Alert variant="success" className="mb-6" onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                  </Alert>
                )}

                {serverError && (
                  <Alert variant="error" className="mb-6" onClose={() => setServerError(null)}>
                    {serverError}
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      id="name"
                      placeholder="Jane Doe"
                      leftIcon={<User className="w-4 h-4" />}
                      error={errors.name?.message}
                      disabled={isSubmitting}
                      {...register('name')}
                    />

                    <Input
                      label="Email Address"
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.email?.message}
                      disabled={isSubmitting}
                      {...register('email')}
                    />
                  </div>

                  <Input
                    label="Subject"
                    id="subject"
                    placeholder="e.g. Model evaluation inquiry"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                    error={errors.subject?.message}
                    disabled={isSubmitting}
                    {...register('subject')}
                  />

                  <Textarea
                    label="Message"
                    id="message"
                    rows={5}
                    placeholder="Describe your question, research topic, or feedback..."
                    error={errors.message?.message}
                    disabled={isSubmitting}
                    {...register('message')}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSubmitting}
                      rightIcon={<Send className="w-4 h-4" />}
                      className="w-full sm:w-auto"
                    >
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Project Context Cards */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal direction="right" delay={300}>
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 space-y-6 shadow-md dark:shadow-none">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Project Classification</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    SolarSense is an MCA (Master of Computer Applications) final-year capstone project.
                    Submissions through this form are logged in MongoDB Atlas and accessible to system administrators.
                  </p>
                </div>

                <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Direct Admin Contact</div>
                      <div className="text-slate-500 dark:text-slate-400">admin@solarsense.internal</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Academic Institution</div>
                      <div className="text-slate-500 dark:text-slate-400">Department of Computer Applications</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                    Data Privacy Notice
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Information entered here is strictly utilized for project verification, evaluator feedback, and technical support. We never share contact credentials.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
};
