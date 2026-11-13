"use client";

import React from 'react';
import Card, { CardData } from '@/components/ui/course-design-cards';

export const sampleCardData: CardData[] = [
  {
    id: 1,
    colorClass: 'green',
    date: 'Feb 2, 2026',
    title: 'Web Designing & UI Systems',
    description: 'Prototyping & Design Tokens',
    progressPercent: '90%',
    progressValue: '90%',
    imgSrc1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    imgAlt1: 'Sarah Jenkins',
    imgSrc2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    imgAlt2: 'David Miller',
    countdownText: '2 days left',
  },
  {
    id: 2,
    colorClass: 'orange',
    date: 'Feb 05, 2026',
    title: 'Mobile Architecture',
    description: 'Shopping & Realtime Sync',
    progressPercent: '30%',
    progressValue: '30%',
    imgSrc1: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    imgAlt1: 'Elena Vance',
    imgSrc2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    imgAlt2: 'Marcus Cole',
    countdownText: '3 weeks left',
  },
  {
    id: 3,
    colorClass: 'red',
    date: 'March 03, 2026',
    title: 'Core Microservices',
    description: 'High-Throughput Payment Gateways',
    progressPercent: '50%',
    progressValue: '50%',
    imgSrc1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    imgAlt1: 'Maya Patel',
    imgSrc2: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
    imgAlt2: 'Liam Thorne',
    countdownText: '5 days left',
  },
  {
    id: 4,
    colorClass: 'blue',
    date: 'March 08, 2026',
    title: 'Cloud Infrastructure & IAM',
    description: 'Terraform & Kubernetes Clusters',
    progressPercent: '20%',
    progressValue: '20%',
    imgSrc1: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    imgAlt1: 'Erik Longman',
    imgSrc2: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
    imgAlt2: 'Jane Doe',
    countdownText: '3 weeks left',
  },
];

export const DefaultDemo: React.FC<{ cards?: CardData[] }> = ({ cards = sampleCardData }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.id} data={card} />
      ))}
    </section>
  );
};

export default DefaultDemo;
