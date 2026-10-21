import { json } from '@sveltejs/kit';
import { cweIndex } from '#lib/server/cwe.ts';

export const prerender = true;

export const GET = () => json(cweIndex());
