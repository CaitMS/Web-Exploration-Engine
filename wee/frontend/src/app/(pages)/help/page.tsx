/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';
import React, { useState } from 'react';
import { Accordion, AccordionItem } from '@nextui-org/accordion';
import { Button } from '@nextui-org/react';
import WEEInput from '../../components/Util/Input';
import WEETextarea from '../../components/Util/Textarea';
import { submitFeedback } from '../../services/feedback';

const faqs = [
  {
    question: 'What is web scraping?',
    answer:
      'Web scraping is the process of extracting data from websites. It is a technique that allows for the gathering of useful information from the internet for various purposes, such as data analysis, market research, and competitive intelligence',
  },
  {
    question: 'Is web scraping legal?',
    answer:
      "Web scraping is legal as long as it is done within the boundaries of the law and respects the website's terms of service.",
  },
  {
    question: 'Can the WEE handle large-scale scraping projects?',
    answer:
      'Yes, the WEE is designed to handle projects of any scale, providing efficient and scalable data extraction solutions.',
  },
  {
    question: 'Is there a limit to the number of websites the WEE can scrape?',
    answer:
      'No, the WEE can scrape an unlimited number of websites, depending on the requirements of the user.',
  },
  {
    question: 'What types of reports can WEE generate?',
    answer:
      'These reports can include summaries, detailed analytics, and custom insights. The specific type of report generated depends on the requirements and preferences of the user.',
  },
  {
    question: 'Does WEE require any technical expertise to use?',
    answer:
      'No, the WEE is designed to be user-friendly and intuitive, making it accessible to users without technical expertise.',
  },
  {
    question: 'Can WEE extract data from dynamic websites?',
    answer:
      'Yes, the WEE is equipped to handle dynamic websites and can extract data from sites that use JavaScript and AJAX.',
  },
  {
    question: 'How do I save my reports generated by WEE?',
    answer:
      'Reports for both individual and summary analyses can be saved directly on their respective pages. You can assign a relevant name to the report and save it. These reports will then be accessible under the "Saved Reports" section.',
  },
  {
    question: 'Can I download the reports generated on WEE?',
    answer:
      'Reports for individual and summary analyses can be downloaded directly from their respective pages. Clicking the download button will automatically download the report as a PDF file.',
  },
  {
    question: 'How can I see the locations of the industries?',
    answer:
      'WEE provides the ability to view the locations of all addresses on a map, accessible on the summary report page.',
  },
  {
    question: 'What is SEO Analysis?',
    answer:
      'Search Engine Optimization (SEO) analysis involves auditing a website to identify opportunities for improving its ranking in search engine results. WEE conducts SEO analysis across three categories: On-Page, Technical, and Keyword.',
  },
  {
    question: 'How can I compare two websites with each other?',
    answer:
      'You can compare two different websites on the comparison page accessible in the result page. Simply select the respective URLs from the dropdown menu, and WEE will generate a detailed comparison report.',
  },
  {
    question: 'What is Sentiment Analysis and how does WEE use it?',
    answer:
      'Sentiment analysis is the process of determining the emotional tone behind a series of words, used to understand the attitudes, opinions, and emotions expressed in a piece of text. WEE utilizes sentiment analysis to evaluate the content of a website, providing insights into whether the text is positive, negative, or neutral. This can help businesses understand customer sentiment and improve their content strategy.',
  },
  {
    question: "How does WEE handle reputation management?",
    answer:
      "WEE helps with reputation management by scraping news articles and performing sentiment analysis to assess the public perception of your brand. It also scrapes social media platforms like Facebook to collect engagement metrics and scrapes review sites to track the number of reviews per star rating, Net Promoter Score (NPS), and TrustIndex ratings. This provides a comprehensive overview of how your brand is viewed across different channels."
  },
  {
    question: "Does WEE support scheduled scraping?",
    answer:
      "Yes, WEE supports scheduled scraping, allowing you to automate data extraction at regular intervals. This feature ensures that your data is always up-to-date without the need for manual intervention, making it easier to track changes over time and stay informed on key metrics."
  }
  
  
];

const VideoThumbnail: React.FC<{
  message: string;
  link: string;
  thumbnail: string;
}> = ({ message, link, thumbnail }) => {
  return (
    <a href={link} target="_blank" className="">
      <img
        className="my-2 border hover:scale-95 border-jungleGreen-500 rounded-xl duration-300"
        src={thumbnail}
        alt="scraping video thumbnail"
      />
    </a>
  );
};

export default function Help() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(email, name, message);

    //Ensure Fields Are Filled In
    if (!email || !name || !message) {
      setError('All fields are required');
      const timer = setTimeout(() => {
        setError('');
      }, 3000);

      return () => clearTimeout(timer);
    }

    //Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      const timer = setTimeout(() => {
        setError('');
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Validate Message
    if (message.length < 2) {
      setError('Message is too short');
      const timer = setTimeout(() => {
        setError('');
      }, 3000);

      return () => clearTimeout(timer);
    }

    const { success, error: feedbackError } = await submitFeedback(email, name, message);

    if (success) {
      setSuccess('Feedback submitted successfully');
      setEmail('');
      setName('');
      setMessage('');
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
    } else {
      setError(`Error: ${feedbackError}`);
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  return (
    <main className="">
      <div id="faq" className="my-16 text-center">
        <h1 className="my-4 mx-9 font-poppins-bold text-5xl md:text-6xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
          Frequently Asked Questions
        </h1>
        <h3 className="font-poppins-semibold text-lg text-jungleGreen-700 dark:text-jungleGreen-100">
          How can we help you?{' '}
        </h3>
      </div>

      <div className="mx-auto px-10 md:px-32 lg:px-48 align-middle mb-6">
        <Accordion
          className="mx-auto "
          selectionMode="multiple"
          variant="splitted"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              className=""
              key={index}
              id={'faq-' + index}
              aria-label={`Accordion ${index + 1}`}
              title={faq.question}
            >
              {faq.answer}
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div
        id="tutorials"
        className="px-6 min-h-screen place-content-center bg-zinc-100 dark:bg-zinc-800"
      >
        <div className="my-16 text-center">
          <h1 className="my-4 font-poppins-bold text-5xl md:text-6xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
            Tutorials
          </h1>
          <h3 className="font-poppins-semibold text-lg text-jungleGreen-700 dark:text-jungleGreen-100">
            Some video guides if you need them.{' '}
          </h3>
        </div>

        <div className=" md:flex md:justify-left gap-2 lg:px-36 md:">
          <VideoThumbnail
            message="What formats can I export the scraped data?"
            thumbnail="images/video-thumbnail.svg"
            link="https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUJcmljayByb2xs"
          />
          <VideoThumbnail
            message="How to scrape multiple reports?"
            thumbnail="images/video-thumbnail.svg"
            link="https://www.youtube.com/watch?v=ZKcuvdnVF80&pp=ygURYSBiaXJkcyBsYXN0IGxvb2s%3D"
          />
        </div>
      </div>

      <div id="feedback" className="mx-6 h-screen md:px-6 place-content-center">
        <div className="my-16 text-center">
          <h1 className="my-4 font-poppins-bold text-5xl md:text-6xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
            Feedback
          </h1>
          <h3 className="font-poppins-semibold text-lg text-jungleGreen-700 dark:text-jungleGreen-100">
            Have a question or an issue you&apos;re experiencing?{' '}
          </h3>
        </div>

        <div className="mb-10 flex flex-col justify-center items-center sm:w-4/5 md:w-full lg:w-4/5 mx-auto">
    {error && (
      <span className="mx-auto mt-4 p-2 w-full text-white bg-red-600 rounded-lg transition-opacity duration-300 ease-in-out flex justify-center align-middle">
        <p>{error}</p>
      </span>
    )}

    {success && (
      <span className="mx-auto mt-4 p-2 w-full text-white bg-jungleGreen-700 rounded-lg transition-opacity duration-300 ease-in-out flex justify-center align-middle">
        <p>{success}</p>
      </span>
    )}


          <div className="flex w-full flex-wrap md:flex-nowrap gap-x-2">
            <WEEInput
              className="my-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              label="Name"
            />
            <WEEInput
              className="my-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
            />
          </div>
          <div className="w-full grid grid-cols-12 gap-1 ">
            <WEETextarea
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              labelPlacement="inside"
              className="col-span-12 my-2 md:my-6"
            />
          </div>

          <Button
            data-testid="send-message-button"
            onClick={sendMessage}
            className="my-3 font-poppins-semibold text-lg bg-jungleGreen-700 text-dark-primaryTextColor dark:bg-jungleGreen-400 dark:text-primaryTextColor w-full"
          >
            Send Message
          </Button>
        </div>
      </div>
    </main>
  );
}
