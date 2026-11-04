import { useEffect, useState } from "react";
import PageShell from "../components/PageShell.jsx";
import { Eyebrow } from "../components/ui.jsx";
import { Reveal } from "../anim.jsx";
import { PLAN_TRIP } from "../data/newPages.js";
import { CONTACT, PAGES } from "../data/content.js";
import { STRAPI_URL } from "../lib/strapi.js";
import { useLocationSearch } from "../lib/location.jsx";
import {
  usePrefilledValue,
  lastDestination,
  DESTINATION_PLACEHOLDER,
  MAX,
} from "../lib/prefill.js";

function ChevronDown() {
  return (
    <svg className="f-chevron" width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
      <path
        d="M1 1 5.5 5.6 10 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Field({ label, htmlFor, error, children }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <label className="f-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="f-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Controlled now, so the chosen option is a value we can read and send. */
function Select({ id, name, options, value, onChange }) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        className="f-control f-select"
        value={value}
        onChange={onChange}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown />
    </div>
  );
}

/** Deliberately loose — enough to catch a typo, not to police real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Long enough for a full itinerary note, short enough to keep one enquiry readable. */
const MESSAGE_MAX = 2000;

/**
 * Everything starts empty: the three selects open on their first option, which
 * is a placeholder rather than an answer, so nothing is sent for a field the
 * visitor never touched.
 */
const EMPTY = {
  name: "",
  email: "",
  date: "",
  group: "",
  preferences: "",
  budget: "",
  message: "",
};

export default function PlanTripPage() {
  const page = PAGES["/plan-your-trip"];
  const { badge, title, sub, info, form } = PLAN_TRIP;

  // Free text now, so there is no list to build: ?destination= from the link on
  // a destination page, else the last destination looked at, else empty.
  const destination = usePrefilledValue({
    search: useLocationSearch(),
    key: "destination",
    fallback: lastDestination,
  });

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [serverError, setServerError] = useState("");
  // Honeypot. Hidden from people and from assistive tech; a bot that fills it
  // in gets its submission dropped without a word.
  const [trap, setTrap] = useState("");

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }, [page]);

  const set = (name) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    // clear the complaint as soon as they start fixing it
    if (errors[name]) setErrors((prev) => omit(prev, name));
    if (status !== "idle") setStatus("idle");
  };

  /** Only name and email can block; everything else is optional. */
  const validate = () => {
    const found = {};
    if (!values.name.trim()) found.name = "Please tell us your name";
    const email = values.email.trim();
    if (!email) found.email = "We need an email to reply to";
    else if (!EMAIL.test(email)) found.email = "That email address doesn't look right";
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();

    // A filled honeypot means a bot. Drop it quietly: no request, and the same
    // thank-you a real visitor sees, so there is nothing to learn from.
    if (trap) {
      setValues(EMPTY);
      destination.reset();
      setStatus("sent");
      return;
    }

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus("sending");
    setServerError("");

    // Strapi rejects a create whose body carries fields it does not know, and it
    // rejects an empty string for a date, so each optional field is added only
    // once it holds something. Every value is trimmed on the way out. No `status`
    // is sent: the record's publication state is not the visitor's to set.
    const data = {
      name: values.name.trim(),
      email: values.email.trim(),
    };
    // The three selects open on their first option, which reads as "any" rather
    // than an answer — so an untouched one is left out entirely.
    if (values.group) data.group = values.group;
    if (values.preferences) data.preferences = values.preferences;
    if (values.budget) data.budget = values.budget;

    const destinationValue = destination.value.trim();
    if (destinationValue) data.destination = destinationValue;
    if (values.date) data.travelDate = values.date;
    if (values.message.trim()) data.message = values.message.trim();

    try {
      const res = await fetch(`${STRAPI_URL}/api/trip-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) throw new Error(`Strapi responded ${res.status} ${res.statusText}`);

      setValues(EMPTY);
      destination.reset();
      setStatus("sent");
    } catch (err) {
      // Everything the visitor typed is left in place so they can press submit
      // again rather than type it all out a second time.
      setStatus("error");
      setServerError(
        err instanceof Error && err.message
          ? `We couldn't send that just now (${err.message}). Please try again, call us, or use the contact page.`
          : "We couldn't send that just now. Please try again, call us, or use the contact page."
      );
    }
  };

  const sending = status === "sending";

  return (
    <PageShell faq={false}>
      <section className="contact-sec">
        <div className="contact-card">
          <img
            src={CONTACT.image}
            alt={CONTACT.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="grad-contact absolute inset-0" />

          <div className="contact-grid relative">
            <div className="contact-left">
              <div className="contact-top">
                <Eyebrow color="var(--color-mist)">{badge}</Eyebrow>
                <h1 className="t-h1c mt-2">
                  {title.map((line, i) => (
                    <Reveal
                      as="span"
                      key={line}
                      effect="far"
                      delay={80 + i * 90}
                      className="block"
                    >
                      {line}
                    </Reveal>
                  ))}
                </h1>
                <Reveal
                  as="p"
                  effect="far"
                  delay={80 + title.length * 90}
                  className="t-body mt-4 text-mist"
                >
                  {sub}
                </Reveal>
              </div>

              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 min-[480px]:gap-6">
                {info.map((i) => (
                  <div key={i.label} className="flex min-w-0 flex-col gap-2">
                    <p className="t-eyebrow capitalize text-mist">{i.label}</p>
                    <p className="t-link capitalize break-words text-sage">{i.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-right">
              <form
                className="flex w-full min-w-0 flex-col rounded-lg bg-cream p-6"
                style={{ maxWidth: 520 }}
                noValidate
                onSubmit={submit}
              >
                <div className="flex flex-col gap-4">
                  <Field label={form.name.label} htmlFor="trip-name" error={errors.name}>
                    <input
                      id="trip-name"
                      name="name"
                      type="text"
                      className={`f-control f-input ${errors.name ? "f-invalid" : ""}`}
                      placeholder={form.name.placeholder}
                      value={values.name}
                      onChange={set("name")}
                      aria-invalid={errors.name ? "true" : undefined}
                      aria-describedby={errors.name ? "trip-name-error" : undefined}
                    />
                  </Field>

                  <Field label={form.email.label} htmlFor="trip-email" error={errors.email}>
                    <input
                      id="trip-email"
                      name="email"
                      type="email"
                      className={`f-control f-input ${errors.email ? "f-invalid" : ""}`}
                      placeholder={form.email.placeholder}
                      value={values.email}
                      onChange={set("email")}
                      aria-invalid={errors.email ? "true" : undefined}
                      aria-describedby={errors.email ? "trip-email-error" : undefined}
                    />
                  </Field>

                  <Field label={form.destination.label} htmlFor="trip-destination">
                    <input
                      id="trip-destination"
                      name="destination"
                      type="text"
                      className="f-control f-input"
                      placeholder={DESTINATION_PLACEHOLDER}
                      maxLength={MAX}
                      value={destination.value}
                      onChange={destination.onChange}
                      aria-describedby={destination.prefilled ? "trip-destination-hint" : undefined}
                    />
                    {destination.prefilled ? (
                      <p id="trip-destination-hint" className="t-eyebrow text-smoke">
                        {destination.hint}
                      </p>
                    ) : null}
                  </Field>

                  <Field label={form.date.label} htmlFor="trip-date">
                    <input
                      id="trip-date"
                      name="date"
                      type="date"
                      className="f-control f-input"
                      value={values.date}
                      onChange={set("date")}
                    />
                  </Field>

                  <Field label={form.group.label} htmlFor="trip-group">
                    <Select
                      id="trip-group"
                      name="group"
                      options={form.group.options}
                      value={values.group}
                      onChange={set("group")}
                    />
                  </Field>

                  <Field label={form.preferences.label} htmlFor="trip-preferences">
                    <Select
                      id="trip-preferences"
                      name="preferences"
                      options={form.preferences.options}
                      value={values.preferences}
                      onChange={set("preferences")}
                    />
                  </Field>

                  <Field label={form.budget.label} htmlFor="trip-budget">
                    <Select
                      id="trip-budget"
                      name="budget"
                      options={form.budget.options}
                      value={values.budget}
                      onChange={set("budget")}
                    />
                  </Field>

                  <Field label={form.message.label} htmlFor="trip-message">
                    <textarea
                      id="trip-message"
                      name="message"
                      className="f-control f-textarea"
                      placeholder={form.message.placeholder}
                      maxLength={MESSAGE_MAX}
                      value={values.message}
                      onChange={set("message")}
                    />
                    <p className="t-eyebrow text-smoke">
                      {values.message.length} of {MESSAGE_MAX}
                    </p>
                  </Field>

                  {/* honeypot: off-screen, skipped by tab order and screen readers */}
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="trip-website">Website</label>
                    <input
                      id="trip-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={trap}
                      onChange={(e) => setTrap(e.target.value)}
                    />
                  </div>
                </div>

                {status === "sent" ? (
                  <p role="status" className="t-body mt-5 rounded-lg bg-mist p-4 text-ink">
                    Thanks — your trip request is on its way. We reply within 24 hours with a route,
                    a price and dates that fit.
                  </p>
                ) : null}

                {status === "error" ? (
                  <p role="alert" className="f-error mt-5">
                    {serverError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={sending}
                  aria-busy={sending}
                  className={`btn btn-dark mt-5 h-[51px] w-full ${sending ? "opacity-60" : ""}`}
                >
                  {sending ? "Sending…" : form.submit}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/** Drop one key, without mutating. */
function omit(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}
