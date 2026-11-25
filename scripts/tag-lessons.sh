#!/bin/bash
# コミットメッセージ「[第N回 StepM] …」から、lessonNN-stepM のタグを付け直すスクリプト
# 使い方（リポジトリの直下で）： bash scripts/tag-lessons.sh
#   付けたタグを GitHub に送るとき： git push origin --tags
set -e
git log --reverse --format='%H %s' main | while read -r hash subject; do
  if [ "$subject" = "Initial commit from Create Next App" ]; then
    git tag -f lesson00-step1 "$hash" >/dev/null
    continue
  fi
  nums=$(printf '%s' "$subject" | sed -nE 's/^\[第([0-9]+)回 Step([0-9]+)\].*/\1 \2/p')
  if [ -n "$nums" ]; then
    set -- $nums
    git tag -f "$(printf 'lesson%02d-step%s' "$1" "$2")" "$hash" >/dev/null
  fi
done
git tag -l 'lesson*' | sort -V
