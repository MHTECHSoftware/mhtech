.PHONY: build clean cacheclean dev

HUGO_ENV:=production

build: clean
	hugo --minify --environment=$(HUGO_ENV) --buildFuture

clean:
	rm -rf ./public

cacheclean: clean
	rm -rf ./resources/_gen/

dev: clean
	npx run-pty % \
		npx --yes decap-server % \
		hugo server --bind 0.0.0.0 --buildDrafts --buildFuture --port=1313 % \
