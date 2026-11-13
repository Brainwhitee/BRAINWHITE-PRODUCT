"use client";

import React from 'react';
import Link from 'next/link';

// Define the type for the card data
export interface CardData {
  id: number | string;
  colorClass: string; // 'green' | 'orange' | 'red' | 'blue' | string
  date: string;
  title: string;
  description: string;
  progressPercent: string;
  progressValue: string;
  imgSrc1?: string;
  imgAlt1?: string;
  imgSrc2?: string;
  imgAlt2?: string;
  countdownText: string;
  href?: string;
  onAddClick?: () => void;
  onCountdownClick?: () => void;
  onMenuClick?: () => void;
}

// Define the props for the Card component
export interface CardProps {
  data: CardData;
  className?: string;
  onClick?: () => void;
}

// SVG components (extracted for reusability and clarity)
const EllipsisIcon: React.FC<{ className?: string }> = ({ className = "size-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
  </svg>
);

const AddIcon: React.FC<{ className?: string }> = ({ className = "size-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);

export const Card: React.FC<CardProps> = ({ data, className = "", onClick }) => {
  const {
    colorClass,
    date,
    title,
    description,
    progressPercent,
    progressValue,
    imgSrc1,
    imgAlt1,
    imgSrc2,
    imgAlt2,
    countdownText,
    href,
    onAddClick,
    onCountdownClick,
    onMenuClick,
  } = data;

  // Resolve numeric percentage for inline width style fallback if needed
  const numericPercent = progressPercent
    ? progressPercent.replace("%", "").trim()
    : progressValue
    ? progressValue.replace("%", "").trim()
    : "0";

  return (
    <div
      className={`card ${colorClass} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="card-header">
        <div className="date">{date}</div>
        <button
          type="button"
          aria-label="Card actions"
          className="text-slate-400 hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer"
          onClick={(e) => {
            if (onMenuClick) {
              e.stopPropagation();
              e.preventDefault();
              onMenuClick();
            }
          }}
        >
          <EllipsisIcon />
        </button>
      </div>

      <div className="card-body">
        {href ? (
          <Link href={href} className="hover:underline">
            <h3>{title}</h3>
          </Link>
        ) : (
          <h3>{title}</h3>
        )}
        <p>{description}</p>
        <div className="progress">
          <span>Progress</span>
          <div className="progress-bar">
            <span
              className="progress-fill"
              style={{ width: `${numericPercent}%` }}
              aria-valuenow={Number(numericPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span>{progressValue}</span>
        </div>
      </div>

      <div className="card-footer">
        <ul>
          {imgSrc1 && (
            <li>
              <img src={imgSrc1} alt={imgAlt1 || 'user avatar'} />
            </li>
          )}
          {imgSrc2 && (
            <li>
              <img src={imgSrc2} alt={imgAlt2 || 'user avatar'} />
            </li>
          )}
          <li>
            {href ? (
              <Link
                href={href}
                className="btn-add"
                aria-label="View course track"
                onClick={(e) => {
                  if (onAddClick) {
                    e.stopPropagation();
                    e.preventDefault();
                    onAddClick();
                  }
                }}
              >
                <AddIcon />
              </Link>
            ) : (
              <button
                type="button"
                className="btn-add"
                aria-label="Add collaborator or view details"
                onClick={(e) => {
                  if (onAddClick) {
                    e.stopPropagation();
                    e.preventDefault();
                    onAddClick();
                  }
                }}
              >
                <AddIcon />
              </button>
            )}
          </li>
        </ul>
        {href ? (
          <Link
            href={href}
            className="btn-countdown"
            onClick={(e) => {
              if (onCountdownClick) {
                e.stopPropagation();
                e.preventDefault();
                onCountdownClick();
              }
            }}
          >
            {countdownText}
          </Link>
        ) : (
          <button
            type="button"
            className="btn-countdown"
            onClick={(e) => {
              if (onCountdownClick) {
                e.stopPropagation();
                e.preventDefault();
                onCountdownClick();
              }
            }}
          >
            {countdownText}
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;
