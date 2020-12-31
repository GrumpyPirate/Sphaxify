@ECHO Generating size packs + zipping up...
@ECHO.

@CALL npm install
@ECHO.

@CALL npm run zip
@ECHO.

@ECHO Complete!
@ECHO.

PAUSE
