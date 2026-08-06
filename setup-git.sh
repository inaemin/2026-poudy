#!/bin/sh
#
# 저장소 Git 설정을 등록한다. 클론 후 한 번만 실행하면 된다.
#
# JDK 나 Node 없이 동작하므로 백엔드, 프론트엔드 모두 이 스크립트를 쓴다.
# commit-msg 훅은 어떤 파일을 고쳤든 모든 커밋에 적용되므로 전원에게 필요하다.

set -e

cd "$(git rev-parse --show-toplevel)"

git config core.hooksPath .githooks
git config commit.template .gitmessage.txt

echo "Git 훅 경로와 커밋 메시지 템플릿을 등록했습니다."
echo "  core.hooksPath   = $(git config --get core.hooksPath)"
echo "  commit.template  = $(git config --get commit.template)"
