-- Add atoma_pay to PayoutMethod enum

ALTER TYPE "PayoutMethod" ADD VALUE IF NOT EXISTS 'atoma_pay';
