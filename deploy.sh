#!/bin/bash
echo "🚀 Deploying to Vercel..."
echo ""
echo "When prompted:"
echo "1. Select 'anonfortyseven' (your personal account)"
echo "2. Say 'no' to linking existing project (create new)"
echo "3. Keep default project name or enter new one"
echo ""
cd ~/Projects/validate-proposal-machine-v2
rm -rf .vercel
vercel --prod
