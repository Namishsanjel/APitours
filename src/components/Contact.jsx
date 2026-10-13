import { useState } from "react";
import { CONTACT } from "../data/content.js";
import { STRAPI_URL } from "../lib/strapi.js";
import { Eyebrow } from "./ui.jsx";
import { Reveal } from "../anim.jsx";
import { useLocationSearch } from "../lib/location.jsx";
import { usePrefilledValue, lastTour, TOUR_PLACEHOLDER, MAX } from "../lib/prefill.js";

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

/** Deliberately loose — enough to catch a typo, not to police real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The tour field is free text and optional, so it starts empty. What it starts
// as comes from prefill.js: ?tour= from a tour page's link, else the last tour
// looked at, else nothing — it is never a dropdown default any more.
const EMPTY = {
  name: "",
  email: "",
  date: "",
  message: "",
};

export default function Contact() {
  const { badge, title, image, imageAlt, info, form } = CONTACT;

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [serverError, setServerError] = useState("");
  // Honeypot. Hidden from people and from assistive tech; a bot that fills it
  // in gets its submission dropped without a word.
  const [trap, setTrap] = useState("");

  const tour = usePrefilledValue({
    search: useLocationSearch(),
    key: "tour",
    fallback: () => lastTour().title,
  });

  const set = (name) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    // clear the complaint as soon as they start fixing it
    if (errors[name]) setErrors((prev) => omit(prev, name));
    if (status !== "idle") setStatus("idle");
  };

  const validate = () => {
    const found = {};
    if (!values.name.trim()) found.name = "Please tell us your name";
    const email = values.email.trim();
    if (!email) found.email = "We need an email to reply to";
    else if (!EMAIL.test(email)) found.email = "That email address doesn't look right";
    if (!values.message.trim()) found.message = "Tell us a little about the trip you're planning";
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();

    // A filled honeypot means a bot. Drop it quietly: no request, no message.
    if (trap) {
      setValues(EMPTY);
      return;
    }

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus("sending");
    setServerError("");

    // Strapi rejects a create whose body carries fields it does not know, so
    // the optional ones are added only once they hold something. The tour field
    // is free text and may be left blank, so `tour` rides along only when the
    // visitor (or a prefill) actually put something in it; travelDate only
    // appears if a date was actually picked.
    const data = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    };
    if (tourValue) data.tour = tourValue;
    if (values.date) data.travelDate = values.date;

    try {
      const res = await fetch(`${STRAPI_URL}/api/contact-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) throw new Error(`Strapi responded ${res.status} ${res.statusText}`);

      setValues(EMPTY);
      tour.reset();
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error && err.message
          ? `We couldn't send that just now (${err.message}). Please try again, or email us directly.`
          : "We couldn't send that just now. Please try again, or email us directly."
      );
    }
  };

  const sending = status === "sending";

  // Cleared once on send, and trimmed on the way out: a free-text field can hold
  // whitespace the select never could, and an all-spaces value is no value.
  const tourValue = tour.value.trim();

  return (
    <section className="contact-sec">
      {/* photo card with the copy on the left and the booking form on the right */}
      <div className="contact-card">
        <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
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
              noValidate
              className="flex w-full min-w-0 flex-col rounded-lg bg-cream p-6"
              style={{ maxWidth: 520 }}
              onSubmit={submit}
            >
              <div className="flex flex-col gap-4">
                <Field label={form.name.label} htmlFor="contact-name" error={errors.name}>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    className={`f-control f-input ${errors.name ? "f-invalid" : ""}`}
                    placeholder={form.name.placeholder}
                    value={values.name}
                    onChange={set("name")}
                    aria-invalid={errors.name ? "true" : undefined}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                  />
                </Field>

                <Field label={form.email.label} htmlFor="contact-email" error={errors.email}>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    className={`f-control f-input ${errors.email ? "f-invalid" : ""}`}
                    placeholder={form.email.placeholder}
                    value={values.email}
                    onChange={set("email")}
                    aria-invalid={errors.email ? "true" : undefined}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                  />
                </Field>

                <Field label={form.hike.label} htmlFor="contact-hike">
                  <input
                    id="contact-hike"
                    name="hike"
                    type="text"
                    className={`f-control f-input ${errors.hike ? "f-invalid" : ""}`}
                    placeholder={TOUR_PLACEHOLDER}
                    maxLength={MAX}
                    value={tour.value}
                    onChange={tour.onChange}
                    aria-invalid={errors.hike ? "true" : undefined}
                    aria-describedby={
                      tour.prefilled
                        ? "contact-hike-hint"
                        : errors.hike
                          ? "contact-hike-error"
                          : undefined
                    }
                  />
                  {tour.prefilled ? (
                    <p id="contact-hike-hint" className="t-eyebrow text-smoke">
                      {tour.hint}
                    </p>
                  ) : null}
                </Field>

                <Field label={form.date.label} htmlFor="contact-date">
                  <input
                    id="contact-date"
                    name="date"
                    type="date"
                    className="f-control f-input"
                    value={values.date}
                    onChange={set("date")}
                  />
                </Field>

                <Field label={form.message.label} htmlFor="contact-message" error={errors.message}>
                  <textarea
                    id="contact-message"
                    name="message"
                    className={`f-control f-textarea ${errors.message ? "f-invalid" : ""}`}
                    placeholder={form.message.placeholder}
                    value={values.message}
                    onChange={set("message")}
                    aria-invalid={errors.message ? "true" : undefined}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                  />
                </Field>

                {/* honeypot: off-screen, skipped by tab order and screen readers */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
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
                  Thanks — your message is on its way. We reply within 24 hours.
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
  );
}

/** Drop one key, without mutating. */
function omit(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}